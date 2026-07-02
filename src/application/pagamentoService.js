// Casos de uso de Pagamento (mock) e fidelidade.
const prisma = require('../infrastructure/prisma');
const auditoria = require('../infrastructure/auditoria');
const gateway = require('../infrastructure/gatewayPagamentoMock');
const { StatusPedido, StatusPagamento, Perfil } = require('../domain/enums');
const {
  NotFoundError,
  ConflictError,
  ForbiddenError,
} = require('../domain/errors');

async function processar({ pedidoId, metodo = 'MOCK', simular }, ctx = {}) {
  const pedido = await prisma.pedido.findUnique({ where: { id: pedidoId }, include: { cliente: true } });
  if (!pedido) throw new NotFoundError('Pedido nao encontrado.');

  // Cliente so paga os proprios pedidos.
  if (ctx.perfil === Perfil.CLIENTE && pedido.clienteId !== ctx.usuarioId) {
    throw new ForbiddenError('Voce nao pode pagar um pedido de outro cliente.');
  }

  if (pedido.status !== StatusPedido.AGUARDANDO_PAGAMENTO) {
    throw new ConflictError(
      'PEDIDO_NAO_PAGAVEL',
      `Pedido no status ${pedido.status} nao pode ser pago.`
    );
  }

  const payloadEnviado = { pedidoId, valor: pedido.total, metodo, simular };

  // Tolerancia a falha do gateway (RNF): captura timeout/erros do provedor.
  let retorno;
  try {
    retorno = await gateway.processarPagamento(payloadEnviado);
  } catch (err) {
    // Registra o pagamento como PENDENTE/falha de comunicacao, sem mudar o pedido.
    const pagamento = await prisma.pagamento.create({
      data: {
        pedidoId,
        status: StatusPagamento.PENDENTE,
        metodo,
        valor: pedido.total,
        payloadEnviado: JSON.stringify(payloadEnviado),
        payloadRetorno: JSON.stringify({ erro: err.code || 'GATEWAY_ERRO', mensagem: err.message }),
      },
    });
    await auditoria.registrar({
      usuarioId: ctx.usuarioId,
      acao: 'PAGAMENTO_FALHA_GATEWAY',
      entidade: 'Pagamento',
      entidadeId: pagamento.id,
      detalhes: { pedidoId, erro: err.code },
      ip: ctx.ip,
    });
    throw new ConflictError(
      'GATEWAY_INDISPONIVEL',
      'Servico de pagamento temporariamente indisponivel. Tente novamente.'
    );
  }

  const statusPagamento = retorno.aprovado ? StatusPagamento.APROVADO : StatusPagamento.RECUSADO;

  // Persiste o pagamento + (se aprovado) avanca pedido e credita pontos.
  const resultado = await prisma.$transaction(async (tx) => {
    const pagamento = await tx.pagamento.create({
      data: {
        pedidoId,
        status: statusPagamento,
        metodo,
        valor: pedido.total,
        transacaoId: retorno.transacaoId,
        payloadEnviado: JSON.stringify(payloadEnviado),
        payloadRetorno: JSON.stringify(retorno.raw),
      },
    });

    let pedidoAtualizado = pedido;
    let pontosCreditados = 0;

    if (retorno.aprovado) {
      pedidoAtualizado = await tx.pedido.update({
        where: { id: pedidoId },
        data: { status: StatusPedido.PAGO },
      });

      // Fidelidade: 1 ponto por real, somente com consentimento LGPD.
      if (pedido.cliente.consentimentoLGPD) {
        const conta = await tx.contaFidelidade.upsert({
          where: { clienteId: pedido.clienteId },
          update: {},
          create: { clienteId: pedido.clienteId },
        });
        pontosCreditados = Math.floor(pedido.total);
        if (pontosCreditados > 0) {
          await tx.contaFidelidade.update({
            where: { id: conta.id },
            data: { saldoPontos: conta.saldoPontos + pontosCreditados },
          });
          await tx.movimentacaoFidelidade.create({
            data: {
              contaId: conta.id,
              tipo: 'ACUMULO',
              pontos: pontosCreditados,
              pedidoId,
              descricao: `Acumulo por compra (pedido ${pedidoId})`,
            },
          });
        }
      }
    }

    return { pagamento, pedido: pedidoAtualizado, pontosCreditados };
  });

  await auditoria.registrar({
    usuarioId: ctx.usuarioId,
    acao: 'PAGAMENTO_PROCESSADO',
    entidade: 'Pagamento',
    entidadeId: resultado.pagamento.id,
    detalhes: { pedidoId, status: statusPagamento, transacaoId: retorno.transacaoId },
    ip: ctx.ip,
  });

  return {
    pagamentoId: resultado.pagamento.id,
    pedidoId,
    statusPagamento,
    statusPedido: resultado.pedido.status,
    transacaoId: retorno.transacaoId,
    mensagem: retorno.mensagem,
    pontosCreditados: resultado.pontosCreditados,
    payloadRetorno: retorno.raw,
  };
}

async function consultarPorPedido(pedidoId) {
  const pagamentos = await prisma.pagamento.findMany({
    where: { pedidoId },
    orderBy: { id: 'desc' },
  });
  return pagamentos.map((p) => ({
    ...p,
    payloadEnviado: p.payloadEnviado ? JSON.parse(p.payloadEnviado) : null,
    payloadRetorno: p.payloadRetorno ? JSON.parse(p.payloadRetorno) : null,
  }));
}

module.exports = { processar, consultarPorPedido };
