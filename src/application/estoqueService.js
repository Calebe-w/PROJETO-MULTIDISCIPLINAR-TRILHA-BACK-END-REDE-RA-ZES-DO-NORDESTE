// Casos de uso de estoque por unidade.
const prisma = require('../infrastructure/prisma');
const auditoria = require('../infrastructure/auditoria');
const { TipoMovimentacaoEstoque } = require('../domain/enums');
const { NotFoundError, ConflictError, ValidationError } = require('../domain/errors');

// Saldo de estoque de uma unidade (todos os produtos cadastrados nela).
async function consultarPorUnidade(unidadeId) {
  const unidade = await prisma.unidade.findUnique({ where: { id: unidadeId } });
  if (!unidade) throw new NotFoundError('Unidade nao encontrada.');

  const estoques = await prisma.estoque.findMany({
    where: { unidadeId },
    include: { produto: true },
    orderBy: { produtoId: 'asc' },
  });
  return estoques.map((e) => ({
    estoqueId: e.id,
    produtoId: e.produtoId,
    produto: e.produto.nome,
    quantidade: e.quantidade,
    disponivel: e.quantidade > 0,
  }));
}

// Movimenta estoque (ENTRADA soma, SAIDA subtrai). Cria o registro de
// estoque caso ainda nao exista para o par (unidade, produto).
async function movimentar({ unidadeId, produtoId, tipo, quantidade, motivo }, ctx = {}) {
  if (quantidade <= 0) {
    throw new ValidationError('Quantidade deve ser maior que zero.', [
      { field: 'quantidade', issue: 'Informe um inteiro positivo.' },
    ]);
  }
  if (!Object.values(TipoMovimentacaoEstoque).includes(tipo)) {
    throw new ValidationError('Tipo de movimentacao invalido.', [
      { field: 'tipo', issue: 'Use ENTRADA ou SAIDA.' },
    ]);
  }

  const unidade = await prisma.unidade.findUnique({ where: { id: unidadeId } });
  if (!unidade) throw new NotFoundError('Unidade nao encontrada.');
  const produto = await prisma.produto.findUnique({ where: { id: produtoId } });
  if (!produto) throw new NotFoundError('Produto nao encontrado.');

  const resultado = await prisma.$transaction(async (tx) => {
    let estoque = await tx.estoque.findUnique({
      where: { unidadeId_produtoId: { unidadeId, produtoId } },
    });
    if (!estoque) {
      estoque = await tx.estoque.create({ data: { unidadeId, produtoId, quantidade: 0 } });
    }

    const novaQtd =
      tipo === TipoMovimentacaoEstoque.ENTRADA
        ? estoque.quantidade + quantidade
        : estoque.quantidade - quantidade;

    if (novaQtd < 0) {
      throw new ConflictError(
        'ESTOQUE_INSUFICIENTE',
        'Saida maior que o saldo disponivel.',
        [{ field: 'quantidade', issue: `Disponivel: ${estoque.quantidade}` }]
      );
    }

    const atualizado = await tx.estoque.update({
      where: { id: estoque.id },
      data: { quantidade: novaQtd },
    });
    await tx.movimentacaoEstoque.create({
      data: { estoqueId: estoque.id, tipo, quantidade, motivo: motivo ?? null, usuarioId: ctx.usuarioId ?? null },
    });
    return atualizado;
  });

  await auditoria.registrar({
    usuarioId: ctx.usuarioId,
    acao: 'ESTOQUE_MOVIMENTADO',
    entidade: 'Estoque',
    entidadeId: resultado.id,
    detalhes: { unidadeId, produtoId, tipo, quantidade, saldoFinal: resultado.quantidade },
    ip: ctx.ip,
  });

  return {
    estoqueId: resultado.id,
    unidadeId,
    produtoId,
    quantidade: resultado.quantidade,
    tipo,
  };
}

module.exports = { consultarPorUnidade, movimentar };
