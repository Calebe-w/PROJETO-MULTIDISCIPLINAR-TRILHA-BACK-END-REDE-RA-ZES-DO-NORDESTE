// Middlewares de autenticacao (JWT) e autorizacao (roles).
const jwt = require('jsonwebtoken');
const env = require('../../config/env');
const { UnauthorizedError, ForbiddenError } = require('../../domain/errors');

// Exige um token JWT valido. Popula req.usuario = { id, perfil, nome }.
function autenticar(req, _res, next) {
  const header = req.headers.authorization || '';
  const [tipo, token] = header.split(' ');
  if (tipo !== 'Bearer' || !token) {
    return next(new UnauthorizedError('NAO_AUTENTICADO', 'Token Bearer ausente.'));
  }
  try {
    const decoded = jwt.verify(token, env.jwtSecret);
    req.usuario = { id: decoded.sub, perfil: decoded.perfil, nome: decoded.nome };
    return next();
  } catch {
    return next(new UnauthorizedError('TOKEN_INVALIDO', 'Token invalido ou expirado.'));
  }
}

// Restringe o acesso a determinados perfis. Uso: autorizar('ADMIN','GERENTE')
function autorizar(...perfis) {
  return (req, _res, next) => {
    if (!req.usuario) return next(new UnauthorizedError());
    if (!perfis.includes(req.usuario.perfil)) {
      return next(new ForbiddenError(`Acesso restrito a: ${perfis.join(', ')}.`));
    }
    return next();
  };
}

module.exports = { autenticar, autorizar };
