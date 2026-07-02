// Casos de uso de Pedido (fluxo critico).
const prisma = require('../infrastructure/prisma');
const auditoria = require('../infrastructure/auditoria');
const {
  CanalPedido,
  StatusPedido,
  TRANSICOES_STATUS,
  Perfil,
} = require('../domain/enums');
const {
  NotFoundError,
  ConflictError,
  ValidationError,
  ForbiddenError,
} = require('../domain/errors');

function arredondar(v) {
  return Math.round(v * 100) / 100;
}

async function criar({ clienteId, unidadeId, canalPedido, itens }, ctx = {}) {
  // 1) Validacao de multicanalidade (canalPedido obrigatorio).
  if (!canalPedido) {
    throw new ValidationError('canalPedido e obrigatorio.', [
      { field: 'canalPedido', issue: `Informe um de: ${Object.values(CanalPedido).join(', ')}` },
    ]);
  }
  if (!Object.values(CanalPedido).includes(canalPedido)) {
    throw new ValidationError('canalPedido invalido.', [
      { field: 'canalPedido', issue: `Use um de: ${Object.values(CanalPedido).join(', ')}` },
    ]);
  }
  if (!Array.isArray(itens) || itens.length === 0) {
    throw new ValidationError('Pedido deve conter ao menos um item.', [
      { field: 'itens', issue: 'Lista vazia.' },
    ]);
  }

  // 2) Unidade precisa existir.
  const unidade = await prisma.unidade.findUnique({ where: { id: unidadeId } });
  if (!unidade) throw new NotFoundError('Unidade informada nao existe.');

  // 3) Transacao: valida estoque, calcula total, da baixa e cria o pedido.
  const pedido = await prisma.$transaction(async (tx) => {
    let total = 0;
    const itensCriar = [];

    for (const item of itens) {
      const produto = await tx.produto.findUnique({ where: { id: item.produtoId } });
      if (!produto || !produto.ativo) {
        throw new NotFoundError(`Produto ${item.produtoId} nao encontrado ou inativo.`);
      }
      const estoque = await tx.estoque.findUnique({
        where: { unidadeId_produtoId: { unidadeId, produtoId: item.produtoId } },
      });
      if (!estoque || estoque.quantidade < item.quantidade) {
        throw new ConflictError(
          'ESTOQUE_INSUFICIENTE',
          'Nao ha quantidade suficiente para um ou mais itens.',
          [{ field: `produto.${item.produtoId}`, issue: `Disponivel: ${estoque ? estoque.quantidade : 0}` }]
        );
      }
      // Baixa de estoque + movimentacao (SAIDA por venda).
      await tx.estoque.update({
        where: { id: estoque.id },
        data: { quantidade: estoque.quantidade - item.quantidade },
      });
      await tx.movimentacaoEstoque.create({
        data: { estoqueId: estoque.id, tipo: 'SAIDA', quantidade: item.quantidade, motivo: 'Venda (pedido)' },
      });

      total += produto.preco * item.quantidade;
      itensCriar.push({ produtoId: produto.id, quantidade: item.quantidade, precoUnitario: produto.preco });
    }

    return tx.pedido.create({
      data: {
        clienteId,
        unidadeId,
        canalPedido,
        status: StatusPedido.AGUARDANDO_PAGAMENTO,
        total: arredondar(total),
        itens: { create: itensCriar },
      },
      include: { itens: true },
    });
  });

  await auditoria.registrar({
    usuarioId: clienteId,
    acao: 'PEDIDO_CRIADO',
    entidade: 'Pedido',
    entidadeId: pedido.id,
    detalhes: { canalPedido, unidadeId, total: pedido.total },
    ip: ctx.ip,
  });

  return pedido;
}

async function buscarPorId(id, ctx = {}) {
  const pedido = await prisma.pedido.findUnique({
    where: { id },
    include: { itens: { include: { produto: true } }, pagamentos: true, unidade: true },
  });
  if (!pedido) throw new NotFoundError('Pedido nao encontrado.');

  // Cliente so enxerga os proprios pedidos.
  if (ctx.perfil === Perfil.CLIENTE && pedido.clienteId !== ctx.usuarioId) {
    throw new ForbiddenError('Voce nao tem acesso a este pedido.');
  }
  return pedido;
}

// Listagem com filtro por canal e status (rastreabilidade multicanal).
async function listar({ page = 1, limit = 10, canalPedido, status }, ctx = {}) {
  const skip = (page - 1) * limit;
  const where = {};
  if (canalPedido) {
    if (!Object.values(CanalPedido).includes(canalPedido)) {
      throw new ValidationError('canalPedido invalido para filtro.', [
        { field: 'canalPedido', issue: `Use um de: ${Object.values(CanalPedido).join(', ')}` },
      ]);
    }
    where.canalPedido = canalPedido;
  }
  if (status) where.status = status;

  // Cliente so lista os proprios pedidos.
  if (ctx.perfil === Perfil.CLIENTE) where.clienteId = ctx.usuarioId;

  const [total, dados] = await Promise.all([
    prisma.pedido.count({ where }),
    prisma.pedido.findMany({
      where,
      skip,
      take: limit,
      orderBy: { id: 'desc' },
      include: { itens: true },
    }),
  ]);
  return { page, limit, total, dados };
}

// Atualizacao de status respeitando a maquina de estados.
async function atualizarStatus(id, novoStatus, ctx = {}) {
  if (!Object.values(StatusPedido).includes(novoStatus)) {
    throw new ValidationError('Status invalido.', [
      { field: 'status', issue: `Use um de: ${Object.values(StatusPedido).join(', ')}` },
    ]);
  }
  const pedido = await prisma.pedido.findUnique({ where: { id } });
  if (!pedido) throw new NotFoundError('Pedido nao encontrado.');

  const permitidos = TRANSICOES_STATUS[pedido.status] || [];
  if (!permitidos.includes(novoStatus)) {
    throw new ConflictError(
      'TRANSICAO_INVALIDA',
      `Nao e possivel mudar de ${pedido.status} para ${novoStatus}.`,
      [{ field: 'status', issue: `Transicoes validas: ${permitidos.join(', ') || 'nenhuma'}` }]
    );
  }

  // Cancelamento devolve o estoque dos itens.
  if (novoStatus === StatusPedido.CANCELADO) {
    await devolverEstoque(id);
  }

  const atualizado = await prisma.pedido.update({ where: { id }, data: { status: novoStatus } });

  await auditoria.registrar({
    usuarioId: ctx.usuarioId,
    acao: 'STATUS_ALTERADO',
    entidade: 'Pedido',
    entidadeId: id,
    detalhes: { de: pedido.status, para: novoStatus },
    ip: ctx.ip,
  });

  return atualizado;
}

async function devolverEstoque(pedidoId) {
  const itens = await prisma.itemPedido.findMany({ where: { pedidoId } });
  const pedido = await prisma.pedido.findUnique({ where: { id: pedidoId } });
  await prisma.$transaction(async (tx) => {
    for (const item of itens) {
      const estoque = await tx.estoque.findUnique({
        where: { unidadeId_produtoId: { unidadeId: pedido.unidadeId, produtoId: item.produtoId } },
      });
      if (estoque) {
        await tx.estoque.update({
          where: { id: estoque.id },
          data: { quantidade: estoque.quantidade + item.quantidade },
        });
        await tx.movimentacaoEstoque.create({
          data: { estoqueId: estoque.id, tipo: 'ENTRADA', quantidade: item.quantidade, motivo: 'Estorno (cancelamento)' },
        });
      }
    }
  });
}

module.exports = { criar, buscarPorId, listar, atualizarStatus };
