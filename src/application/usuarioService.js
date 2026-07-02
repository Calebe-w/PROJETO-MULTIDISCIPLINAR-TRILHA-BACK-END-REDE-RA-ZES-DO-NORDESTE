// Casos de uso de usuarios (perfil e gestao da equipe).
const bcrypt = require('bcryptjs');
const prisma = require('../infrastructure/prisma');
const auditoria = require('../infrastructure/auditoria');
const { sanitizar } = require('./authService');
const { Perfil } = require('../domain/enums');
const { NotFoundError, ConflictError, ValidationError } = require('../domain/errors');

async function meuPerfil(usuarioId) {
  const usuario = await prisma.usuario.findUnique({
    where: { id: usuarioId },
    include: { unidade: true, contaFidelidade: true },
  });
  if (!usuario) throw new NotFoundError('Usuario nao encontrado.');
  return sanitizar(usuario);
}

// Criacao de funcionarios (ADMIN). Permite escolher o perfil e a unidade.
async function criarFuncionario(dados, ctx = {}) {
  const { nome, email, senha, perfil, unidadeId, telefone } = dados;
  if (!Object.values(Perfil).includes(perfil)) {
    throw new ValidationError('Perfil invalido.', [
      { field: 'perfil', issue: `Use um de: ${Object.values(Perfil).join(', ')}` },
    ]);
  }
  const existente = await prisma.usuario.findUnique({ where: { email } });
  if (existente) throw new ConflictError('EMAIL_EM_USO', 'E-mail ja cadastrado.');

  if (unidadeId) {
    const unidade = await prisma.unidade.findUnique({ where: { id: unidadeId } });
    if (!unidade) throw new NotFoundError('Unidade informada nao existe.');
  }

  const senhaHash = await bcrypt.hash(senha, 10);
  const usuario = await prisma.usuario.create({
    data: { nome, email, senhaHash, perfil, telefone: telefone ?? null, unidadeId: unidadeId ?? null },
  });

  await auditoria.registrar({
    usuarioId: ctx.usuarioId,
    acao: 'FUNCIONARIO_CRIADO',
    entidade: 'Usuario',
    entidadeId: usuario.id,
    detalhes: { perfil, unidadeId: unidadeId ?? null },
    ip: ctx.ip,
  });

  return sanitizar(usuario);
}

async function listar({ page = 1, limit = 10 }) {
  const skip = (page - 1) * limit;
  const [total, dados] = await Promise.all([
    prisma.usuario.count(),
    prisma.usuario.findMany({
      skip,
      take: limit,
      orderBy: { id: 'asc' },
      select: { id: true, nome: true, email: true, perfil: true, ativo: true, unidadeId: true, createdAt: true },
    }),
  ]);
  return { page, limit, total, dados };
}

module.exports = { meuPerfil, criarFuncionario, listar };
