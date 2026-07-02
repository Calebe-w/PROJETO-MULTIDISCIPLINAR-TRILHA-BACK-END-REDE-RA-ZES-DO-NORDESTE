// Erros de negocio tipados.

class AppError extends Error {
  constructor(code, message, status = 400, details = []) {
    super(message);
    this.name = 'AppError';
    this.code = code;
    this.status = status;
    this.details = details;
  }
}

// 400/422 - validacao
class ValidationError extends AppError {
  constructor(message = 'Dados invalidos.', details = []) {
    super('VALIDACAO', message, 422, details);
  }
}

// 401 - nao autenticado / credenciais invalidas
class UnauthorizedError extends AppError {
  constructor(code = 'NAO_AUTENTICADO', message = 'Autenticacao necessaria.') {
    super(code, message, 401);
  }
}

// 403 - autenticado, mas sem permissao
class ForbiddenError extends AppError {
  constructor(message = 'Voce nao tem permissao para esta acao.') {
    super('SEM_PERMISSAO', message, 403);
  }
}

// 404 - recurso inexistente
class NotFoundError extends AppError {
  constructor(message = 'Recurso nao encontrado.') {
    super('NAO_ENCONTRADO', message, 404);
  }
}

// 409 - conflito / regra de negocio
class ConflictError extends AppError {
  constructor(code = 'CONFLITO', message = 'Conflito de regra de negocio.', details = []) {
    super(code, message, 409, details);
  }
}

module.exports = {
  AppError,
  ValidationError,
  UnauthorizedError,
  ForbiddenError,
  NotFoundError,
  ConflictError,
};
