// Rotas e configuracao do Swagger UI baseada em openapi.yaml.
const path = require('path');
const YAML = require('yamljs');
const swaggerUi = require('swagger-ui-express');

const openapiPath = path.join(__dirname, '..', '..', 'openapi.yaml');
const documento = YAML.load(openapiPath);

function montarSwagger(app) {
  app.get('/docs.json', (_req, res) => res.json(documento));
  app.use('/docs', swaggerUi.serve, swaggerUi.setup(documento, {
    customSiteTitle: 'API Lanchonete - Documentacao',
  }));
}

module.exports = { montarSwagger };
