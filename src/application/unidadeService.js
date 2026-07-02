// Casos de uso de unidades da rede.
const prisma = require('../infrastructure/prisma');
const { NotFoundError } = require('../domain/errors');

async function listar({ page = 1, limit = 10 }) {
  const skip = (page - 1) * limit;
  const [total, dados] = await Promise.all([
    prisma.unidade.count(),
    prisma.unidade.findMany({ skip, take: limit, orderBy: { id: 'asc' } }),
  ]);
  return { page, limit, total, dados };
}

async function buscarPorId(id) {
  const unidade = await prisma.unidade.findUnique({ where: { id } });
  if (!unidade) throw new NotFoundError('Unidade nao encontrada.');
  return unidade;
}

async function criar(dados) {
  return prisma.unidade.create({ data: dados });
}

async function atualizar(id, dados) {
  await buscarPorId(id);
  return prisma.unidade.update({ where: { id }, data: dados });
}

// Cardapio da unidade: produtos ativos com estoque cadastrado.
// Marca disponibilidade conforme quantidade > 0.
async function cardapio(unidadeId) {
  await buscarPorId(unidadeId);
  const estoques = await prisma.estoque.findMany({
    where: { unidadeId, produto: { ativo: true } },
    include: { produto: true },
    orderBy: { produtoId: 'asc' },
  });
  return estoques.map((e) => ({
    produtoId: e.produtoId,
    nome: e.produto.nome,
    descricao: e.produto.descricao,
    categoria: e.produto.categoria,
    preco: e.produto.preco,
    quantidadeDisponivel: e.quantidade,
    disponivel: e.quantidade > 0,
  }));
}

module.exports = { listar, buscarPorId, criar, atualizar, cardapio };
