// Enumeracoes do dominio.

const Perfil = Object.freeze({
  ADMIN: 'ADMIN',
  GERENTE: 'GERENTE',
  ATENDENTE: 'ATENDENTE',
  COZINHA: 'COZINHA',
  CLIENTE: 'CLIENTE',
});

const CanalPedido = Object.freeze({
  APP: 'APP',
  TOTEM: 'TOTEM',
  BALCAO: 'BALCAO',
  PICKUP: 'PICKUP',
  WEB: 'WEB',
});

const StatusPedido = Object.freeze({
  AGUARDANDO_PAGAMENTO: 'AGUARDANDO_PAGAMENTO',
  PAGO: 'PAGO',
  EM_PREPARO: 'EM_PREPARO',
  PRONTO: 'PRONTO',
  ENTREGUE: 'ENTREGUE',
  CANCELADO: 'CANCELADO',
});

// Transicoes de status permitidas (maquina de estados do pedido).
// cozinha -> pronto -> entregue / cancelado
const TRANSICOES_STATUS = Object.freeze({
  AGUARDANDO_PAGAMENTO: ['PAGO', 'CANCELADO'],
  PAGO: ['EM_PREPARO', 'CANCELADO'],
  EM_PREPARO: ['PRONTO', 'CANCELADO'],
  PRONTO: ['ENTREGUE'],
  ENTREGUE: [],
  CANCELADO: [],
});

const StatusPagamento = Object.freeze({
  PENDENTE: 'PENDENTE',
  APROVADO: 'APROVADO',
  RECUSADO: 'RECUSADO',
});

const MetodoPagamento = Object.freeze({
  MOCK: 'MOCK',
  PIX: 'PIX',
  CARTAO: 'CARTAO',
});

const TipoMovimentacaoEstoque = Object.freeze({
  ENTRADA: 'ENTRADA',
  SAIDA: 'SAIDA',
});

const CategoriaProduto = Object.freeze({
  LANCHE: 'LANCHE',
  BEBIDA: 'BEBIDA',
  ACOMPANHAMENTO: 'ACOMPANHAMENTO',
  SOBREMESA: 'SOBREMESA',
});

module.exports = {
  Perfil,
  CanalPedido,
  StatusPedido,
  TRANSICOES_STATUS,
  StatusPagamento,
  MetodoPagamento,
  TipoMovimentacaoEstoque,
  CategoriaProduto,
};
