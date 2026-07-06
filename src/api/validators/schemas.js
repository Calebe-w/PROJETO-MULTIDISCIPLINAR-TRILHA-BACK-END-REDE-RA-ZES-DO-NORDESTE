// Schemas de validacao (Zod) dos contratos de request.
const { z } = require('zod');
const {
  CanalPedido,
  StatusPedido,
  Perfil,
  CategoriaProduto,
  TipoMovimentacaoEstoque,
  MetodoPagamento,
} = require('../../domain/enums');

const senha = z
  .string()
  .min(8, 'A senha deve ter ao menos 8 caracteres.')
  .max(72, 'Senha muito longa.');

const email = z.string().email('E-mail invalido.');

// ----- Paginacao (query) -----
const paginacao = z.object({
  page: z.coerce.number().int().positive().default(1),
  limit: z.coerce.number().int().positive().max(100).default(10),
});

// ----- Auth -----
const registroSchema = z.object({
  nome: z.string().min(2, 'Nome obrigatorio.'),
  email,
  senha,
  telefone: z.string().optional(),
  consentimentoLGPD: z.boolean().optional().default(false),
});

const loginSchema = z.object({
  email,
  senha: z.string().min(1, 'Senha obrigatoria.'),
});

const refreshSchema = z.object({
  refreshToken: z.string().min(1, 'refreshToken obrigatorio.'),
});

// ----- Usuario (funcionario) -----
const funcionarioSchema = z.object({
  nome: z.string().min(2),
  email,
  senha,
  perfil: z.enum(Object.values(Perfil)),
  unidadeId: z.number().int().positive().optional(),
  telefone: z.string().optional(),
});

// ----- Unidade -----
const unidadeSchema = z.object({
  nome: z.string().min(2),
  cidade: z.string().min(2),
  endereco: z.string().optional(),
  ativo: z.boolean().optional(),
});

// ----- Produto -----
const produtoSchema = z.object({
  nome: z.string().min(2),
  descricao: z.string().optional(),
  categoria: z.enum(Object.values(CategoriaProduto)).optional(),
  preco: z.number().positive('Preco deve ser positivo.'),
  ativo: z.boolean().optional(),
});

const produtoUpdateSchema = produtoSchema.partial();

const produtoQuerySchema = paginacao.extend({
  categoria: z.enum(Object.values(CategoriaProduto)).optional(),
});

// ----- Estoque -----
const movimentacaoSchema = z.object({
  unidadeId: z.number().int().positive(),
  produtoId: z.number().int().positive(),
  tipo: z.enum(Object.values(TipoMovimentacaoEstoque)),
  quantidade: z.number().int().positive('Quantidade deve ser positiva.'),
  motivo: z.string().optional(),
});

// ----- Pedido -----
const itemSchema = z.object({
  produtoId: z.number().int().positive(),
  quantidade: z.number().int().positive('Quantidade deve ser positiva.'),
});

const pedidoSchema = z.object({
  unidadeId: z.number().int().positive(),
  // canalPedido obrigatorio (multicanalidade) com mensagem dedicada.
  canalPedido: z.enum(Object.values(CanalPedido), {
    errorMap: () => ({ message: `canalPedido obrigatorio e deve ser um de: ${Object.values(CanalPedido).join(', ')}` }),
  }),
  itens: z.array(itemSchema).min(1, 'Informe ao menos um item.'),
});

const pedidoQuerySchema = paginacao.extend({
  canalPedido: z.enum(Object.values(CanalPedido)).optional(),
  status: z.enum(Object.values(StatusPedido)).optional(),
});

const statusSchema = z.object({
  status: z.enum(Object.values(StatusPedido)),
});

// ----- Pagamento -----
const pagamentoSchema = z.object({
  pedidoId: z.number().int().positive(),
  metodo: z.enum(Object.values(MetodoPagamento)).optional().default('MOCK'),
  // Controla o resultado simulado do gateway mock.
  simular: z.enum(['APROVAR', 'RECUSAR', 'TIMEOUT']).optional(),
});

// ----- Fidelidade -----
const resgateSchema = z.object({
  pontos: z.number().int().positive(),
});

const consentimentoSchema = z.object({
  consentir: z.boolean(),
});

const idParamSchema = z.object({
  id: z.coerce.number().int().positive('id invalido.'),
});

module.exports = {
  paginacao,
  registroSchema,
  loginSchema,
  refreshSchema,
  funcionarioSchema,
  unidadeSchema,
  produtoSchema,
  produtoUpdateSchema,
  produtoQuerySchema,
  movimentacaoSchema,
  pedidoSchema,
  pedidoQuerySchema,
  statusSchema,
  pagamentoSchema,
  resgateSchema,
  consentimentoSchema,
  idParamSchema,
};
