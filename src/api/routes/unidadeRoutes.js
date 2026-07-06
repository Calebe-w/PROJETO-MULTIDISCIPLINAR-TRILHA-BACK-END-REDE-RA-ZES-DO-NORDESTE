// Rotas de unidades (/unidades)
const { Router } = require('express');
const ah = require('../utils/asyncHandler');
const { validate } = require('../middlewares/validate');
const { autenticar, autorizar } = require('../middlewares/auth');
const { unidadeSchema, paginacao, idParamSchema } = require('../validators/schemas');
const { Perfil } = require('../../domain/enums');
const unidadeService = require('../../application/unidadeService');

const router = Router();

// GET /unidades - lista unidades (autenticado)
router.get(
  '/',
  autenticar,
  validate(paginacao, 'query'),
  ah(async (req, res) => {
    res.json(await unidadeService.listar(req.query));
  })
);

// GET /unidades/{id} - detalhe
router.get(
  '/:id',
  autenticar,
  validate(idParamSchema, 'params'),
  ah(async (req, res) => {
    res.json(await unidadeService.buscarPorId(req.params.id));
  })
);

// GET /unidades/{id}/cardapio - cardapio por unidade (consulta da API)
router.get(
  '/:id/cardapio',
  autenticar,
  validate(idParamSchema, 'params'),
  ah(async (req, res) => {
    res.json(await unidadeService.cardapio(req.params.id));
  })
);

// POST /unidades - cria (ADMIN)
router.post(
  '/',
  autenticar,
  autorizar(Perfil.ADMIN),
  validate(unidadeSchema),
  ah(async (req, res) => {
    res.status(201).json(await unidadeService.criar(req.body));
  })
);

// PUT /unidades/{id} - atualiza (ADMIN/GERENTE)
router.put(
  '/:id',
  autenticar,
  autorizar(Perfil.ADMIN, Perfil.GERENTE),
  validate(idParamSchema, 'params'),
  validate(unidadeSchema.partial()),
  ah(async (req, res) => {
    res.json(await unidadeService.atualizar(req.params.id, req.body));
  })
);

module.exports = router;
