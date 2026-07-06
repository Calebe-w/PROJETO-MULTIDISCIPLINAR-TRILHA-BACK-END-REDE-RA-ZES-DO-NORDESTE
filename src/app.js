// Composicao da aplicacao Express (sem subir o servidor - facilita testes).
const express = require('express');
const cors = require('cors');

const { requestId } = require('./api/middlewares/requestId');
const { errorHandler, notFound } = require('./api/middlewares/errorHandler');
const rotas = require('./api/routes');
const { montarSwagger } = require('./api/swagger');

function criarApp() {
  const app = express();

  // Seguranca e infra basica
  app.use(cors());
  app.use(express.json());
  app.use(requestId);

  // Healthcheck
  app.get('/health', (_req, res) => res.json({ status: 'ok', timestamp: new Date().toISOString() }));

  // Documentacao (Swagger/OpenAPI)
  montarSwagger(app);

  // Rotas da API
  app.use('/api', rotas);

  // 404 + tratamento de erros (sempre por ultimo)
  app.use(notFound);
  app.use(errorHandler);

  return app;
}

module.exports = { criarApp };
