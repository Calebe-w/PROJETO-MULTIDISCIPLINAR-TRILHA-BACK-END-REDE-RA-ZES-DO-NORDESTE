// Casos de uso de autenticacao.
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const prisma = require('../infrastructure/prisma');
const auditoria = require('../infrastructure/auditoria');
const env = require('../config/env');
const { Perfil } = require('../domain/enums');
const {
  UnauthorizedError,
  ConflictError,
  ValidationError,
} = require('../domain/errors');

// Remove campos sensiveis antes de devolver o usuario.
function sanitizar(usuario) {
  if (!usuario) return usuario;
  // eslint-disable-next-line no-unused-vars
  const { senhaHash, ...resto } = usuario;
  return resto;
}

function gerarTokens(usuario) {
  const payload = { sub: usuario.id, perfil: usuario.perfil, nome: usuario.nome };
  const accessToken = jwt.sign(payload, env.jwtSecret, { expiresIn: env.jwtExpiresIn });
  const refreshToken = jwt.sign({ sub: usuario.id, tipo: 'refresh' }, env.jwtSecret, {
    expiresIn: env.jwtRefreshExpiresIn,
  });
  return { accessToken, refreshToken };
}

// Cadastro publico de cliente. Funcionarios sao criados via /usuarios (admin).
async function registrarCliente({ nome, email, senha, telefone, consentimentoLGPD }, ctx = {}) {
  const existente = await prisma.usuario.findUnique({ where: { email } });
  if (existente) {
    throw new ConflictError('EMAIL_EM_USO', 'Ja existe um usuario com este e-mail.');
  }

  const senhaHash = await bcrypt.hash(senha, 10);
  const usuario = await prisma.usuario.create({
    data: {
      nome,
      email,
      senhaHash,
      telefone: telefone ?? null,
      perfil: Perfil.CLIENTE,
      consentimentoLGPD: Boolean(consentimentoLGPD),
      consentimentoEm: consentimentoLGPD ? new Date() : null,
      // Cria a conta de fidelidade junto (saldo zero).
      contaFidelidade: { create: {} },
    },
  });

  await auditoria.registrar({
    usuarioId: usuario.id,
    acao: 'USUARIO_CADASTRADO',
    entidade: 'Usuario',
    entidadeId: usuario.id,
    detalhes: { perfil: usuario.perfil, consentimentoLGPD: usuario.consentimentoLGPD },
    ip: ctx.ip,
  });

  return sanitizar(usuario);
}

async function login({ email, senha }, ctx = {}) {
  const usuario = await prisma.usuario.findUnique({ where: { email } });
  // Mesma mensagem para usuario inexistente ou senha errada (evita enumeracao).
  if (!usuario || !usuario.ativo) {
    throw new UnauthorizedError('CREDENCIAIS_INVALIDAS', 'E-mail ou senha invalidos.');
  }
  const ok = await bcrypt.compare(senha, usuario.senhaHash);
  if (!ok) {
    throw new UnauthorizedError('CREDENCIAIS_INVALIDAS', 'E-mail ou senha invalidos.');
  }

  const tokens = gerarTokens(usuario);

  await auditoria.registrar({
    usuarioId: usuario.id,
    acao: 'LOGIN',
    entidade: 'Usuario',
    entidadeId: usuario.id,
    ip: ctx.ip,
  });

  return {
    ...tokens,
    tokenType: 'Bearer',
    user: sanitizar(usuario),
  };
}

async function refresh({ refreshToken }) {
  if (!refreshToken) throw new ValidationError('refreshToken e obrigatorio.');
  let decoded;
  try {
    decoded = jwt.verify(refreshToken, env.jwtSecret);
  } catch {
    throw new UnauthorizedError('TOKEN_INVALIDO', 'Refresh token invalido ou expirado.');
  }
  if (decoded.tipo !== 'refresh') {
    throw new UnauthorizedError('TOKEN_INVALIDO', 'Token informado nao e um refresh token.');
  }
  const usuario = await prisma.usuario.findUnique({ where: { id: decoded.sub } });
  if (!usuario || !usuario.ativo) {
    throw new UnauthorizedError('TOKEN_INVALIDO', 'Usuario nao encontrado.');
  }
  const { accessToken } = gerarTokens(usuario);
  return { accessToken, tokenType: 'Bearer' };
}

module.exports = { registrarCliente, login, refresh, sanitizar };
