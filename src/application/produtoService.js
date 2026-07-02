// Casos de uso de produtos (catalogo / cardapio).
const prisma = require('../infrastructure/prisma');
const { NotFoundError } = require('../domain/errors');

async function listar({ page = 1, limit = 10, categoria }) {
  const skip = (page - 1) * limit;
  const where = categoria ? { categoria } : {};
  const [total, dados] = await Promise.all([
    prisma.produto.count({ where }),
    prisma.produto.findMany({ where, skip, take: limit, orderBy: { id: 'asc' } }),
  ]);
  return { page, limit, total, dados };
}

async function buscarPorId(id) {
  const produto = await prisma.produto.findUnique({ where: { id } });
  if (!produto) throw new NotFoundError('Produto nao encontrado.');
  return produto;
}

async function criar(dados) {
  return prisma.produto.create({ data: dados });
}

async function atualizar(id, dados) {
  await buscarPorId(id);
  return prisma.produto.update({ where: { id }, data: dados });
}

// Exclusao logica (mantem historico de pedidos consistente).
async function desativar(id) {
  await buscarPorId(id);
  return prisma.produto.update({ where: { id }, data: { ativo: false } });
}

module.exports = { listar, buscarPorId, criar, atualizar, desativar };
