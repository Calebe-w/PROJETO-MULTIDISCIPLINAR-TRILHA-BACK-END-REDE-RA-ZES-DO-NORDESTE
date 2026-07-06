// Ponto de entrada: sobe o servidor HTTP.
const env = require('./config/env');
const { criarApp } = require('./app');
const logger = require('./infrastructure/logger');

const app = criarApp();

const server = app.listen(env.port, () => {
  // eslint-disable-next-line no-console
  console.log(`\n  API Lanchonete rodando em http://localhost:${env.port}`);
  // eslint-disable-next-line no-console
  console.log(`  Swagger/OpenAPI:        http://localhost:${env.port}/docs`);
  // eslint-disable-next-line no-console
  console.log(`  Healthcheck:            http://localhost:${env.port}/health\n`);
});

// Encerramento gracioso
process.on('SIGINT', () => {
  logger.info('Encerrando servidor...');
  server.close(() => process.exit(0));
});

module.exports = server;
