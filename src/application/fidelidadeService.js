// Programa de fidelidade (pontos e resgate).
const prisma = require('../infrastructure/prisma');
const auditoria = require('../infrastructure/auditoria');
const { NotFoundError, ConflictError } = require('../domain/errors');

async function obterConta(clienteId) {
  const conta = await prisma.contaFidelidade.findUnique({
    where: { clienteId },
    include: { movimentacoes: { orderBy: { id: 'desc' }, take: 20 } },
  });
  if (!conta) throw new NotFoundError('Conta de fidelidade nao encontrada.');
  return {
    clienteId,
    saldoPontos: conta.saldoPontos,
    historico: conta.movimentacoes,
  };
}

// Registra/atualiza o consentimento LGPD do cliente para a fidelidade.
async function registrarConsentimento(clienteId, consentir, ctx = {}) {
  const cliente = await prisma.usuario.update({
    where: { id: clienteId },
    data: {
      consentimentoLGPD: Boolean(consentir),
      consentimentoEm: consentir ? new Date() : null,
    },
  });
  // Garante a conta de fidelidade.
  await prisma.contaFidelidade.upsert({
    where: { clienteId },
    update: {},
    create: { clienteId },
  });

  await auditoria.registrar({
    usuarioId: clienteId,
    acao: 'CONSENTIMENTO_LGPD_ATUALIZADO',
    entidade: 'Usuario',
    entidadeId: clienteId,
    detalhes: { consentimentoLGPD: cliente.consentimentoLGPD },
    ip: ctx.ip,
  });

  return { clienteId, consentimentoLGPD: cliente.consentimentoLGPD, consentimentoEm: cliente.consentimentoEm };
}

// Resgate simples: troca pontos por desconto (1 ponto = R$ 0,01 ilustrativo).
async function resgatar(clienteId, pontos, ctx = {}) {
  if (!Number.isInteger(pontos) || pontos <= 0) {
    throw new ConflictError('RESGATE_INVALIDO', 'Quantidade de pontos invalida.');
  }
  const resultado = await prisma.$transaction(async (tx) => {
    const conta = await tx.contaFidelidade.findUnique({ where: { clienteId } });
    if (!conta) throw new NotFoundError('Conta de fidelidade nao encontrada.');
    if (conta.saldoPontos < pontos) {
      throw new ConflictError('SALDO_INSUFICIENTE', 'Saldo de pontos insuficiente para resgate.', [
        { field: 'pontos', issue: `Saldo atual: ${conta.saldoPontos}` },
      ]);
    }
    const atualizada = await tx.contaFidelidade.update({
      where: { id: conta.id },
      data: { saldoPontos: conta.saldoPontos - pontos },
    });
    await tx.movimentacaoFidelidade.create({
      data: { contaId: conta.id, tipo: 'RESGATE', pontos, descricao: 'Resgate de pontos' },
    });
    return atualizada;
  });

  await auditoria.registrar({
    usuarioId: clienteId,
    acao: 'FIDELIDADE_RESGATE',
    entidade: 'ContaFidelidade',
    entidadeId: resultado.id,
    detalhes: { pontosResgatados: pontos, saldoFinal: resultado.saldoPontos },
    ip: ctx.ip,
  });

  return { clienteId, pontosResgatados: pontos, saldoPontos: resultado.saldoPontos };
}

module.exports = { obterConta, registrarConsentimento, resgatar };
