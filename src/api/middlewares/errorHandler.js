// Tratamento centralizado de erros em JSON padronizado.
const { ZodError } = require('zod');
const { AppError } = require('../../domain/errors');
const logger = require('../../infrastructure/logger');

// Middleware para rotas inexistentes (404 padronizado).
function notFound(req, res) {
  res.status(404).json({
    error: 'ROTA_NAO_ENCONTRADA',
    message: `Rota ${req.method} ${req.path} nao existe.`,
    details: [],
    timestamp: new Date().toISOString(),
    path: req.originalUrl,
    requestId: req.id,
  });
}

// eslint-disable-next-line no-unused-vars
function errorHandler(err, req, res, _next) {
  let status = 500;
  let body = {
    error: 'ERRO_INTERNO',
    message: 'Ocorreu um erro inesperado.',
    details: [],
  };

  if (err instanceof ZodError) {
    status = 422;
    body = {
      error: 'VALIDACAO',
      message: 'Erro de validacao nos dados enviados.',
      details: err.errors.map((e) => ({ field: e.path.join('.') || '(corpo)', issue: e.message })),
    };
  } else if (err instanceof AppError) {
    status = err.status;
    body = { error: err.code, message: err.message, details: err.details || [] };
  } else if (err.code === 'P2002') {
    // Violacao de unique do Prisma.
    status = 409;
    body = { error: 'CONFLITO', message: 'Registro duplicado.', details: [] };
  } else {
    logger.error('Erro nao tratado', { erro: err.message, stack: err.stack });
  }

  res.status(status).json({
    ...body,
    timestamp: new Date().toISOString(),
    path: req.originalUrl,
    requestId: req.id,
  });
}

module.exports = { errorHandler, notFound };
