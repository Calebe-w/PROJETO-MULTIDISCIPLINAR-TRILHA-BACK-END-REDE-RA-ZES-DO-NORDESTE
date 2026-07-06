// Middleware de validacao de schema (Zod).
function validate(schema, fonte = 'body') {
  return (req, _res, next) => {
    try {
      const dados = schema.parse(req[fonte]);
      req[fonte] = dados;
      next();
    } catch (err) {
      next(err);
    }
  };
}

module.exports = { validate };
