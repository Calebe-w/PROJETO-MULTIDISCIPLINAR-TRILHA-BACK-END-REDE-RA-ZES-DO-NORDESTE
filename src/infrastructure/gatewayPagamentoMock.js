// Gateway de Pagamento MOCK para testes.
const { randomUUID } = require('crypto');

// Decide o resultado do pagamento para simular cenarios do gateway.
async function processarPagamento(payload) {
  const { simular } = payload;

  // Simula latencia de rede do provedor externo.
  await new Promise((resolve) => setTimeout(resolve, 30));

  if (simular === 'TIMEOUT') {
    const err = new Error('Gateway de pagamento indisponivel (timeout).');
    err.code = 'GATEWAY_TIMEOUT';
    throw err;
  }

  const aprovado = simular !== 'RECUSAR';
  const transacaoId = `mock_${randomUUID()}`;
  const mensagem = aprovado
    ? 'Pagamento aprovado pelo provedor (mock).'
    : 'Pagamento recusado pelo provedor (mock): saldo/credito insuficiente.';

  return {
    aprovado,
    transacaoId,
    mensagem,
    raw: {
      provider: 'MOCK-GATEWAY',
      transactionId: transacaoId,
      status: aprovado ? 'APPROVED' : 'DECLINED',
      amount: payload.valor,
      method: payload.metodo,
      processedAt: new Date().toISOString(),
    },
  };
}

module.exports = { processarPagamento };
