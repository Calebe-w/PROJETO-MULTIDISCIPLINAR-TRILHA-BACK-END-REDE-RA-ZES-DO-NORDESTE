// Rotas de catalogo/produtos (/produtos)
const { Router } = require('express');
const ah = require('../utils/asyncHandler');
const { validate } = require('../middlewares/validate');
const { autenticar, autorizar } = require('../middlewares/auth');
const {
  produtoSchema,
  produtoUpdateSchema,
  produtoQuerySchema,
  idParamSchema,
} = require('../validators/schemas');
const { Perfil } = require('../../domain/enums');
const produtoService = require('../../application/produtoService');

const router = Router();

// GET /produtos - lista paginada, filtro por categoria
router.get(
  '/',
  autenticar,
  validate(produtoQuerySchema, 'query'),
  ah(async (req, res) => {
    res.json(await produtoService.listar(req.query));
  })
);

// GET /produtos/{id}
router.get(
  '/:id',
  autenticar,
  validate(idParamSchema, 'params'),
  ah(async (req, res) => {
    res.json(await produtoService.buscarPorId(req.params.id));
  })
);

// POST /produtos - cria (ADMIN/GERENTE)
router.post(
  '/',
  autenticar,
  autorizar(Perfil.ADMIN, Perfil.GERENTE),
  validate(produtoSchema),
  ah(async (req, res) => {
    res.status(201).json(await produtoService.criar(req.body));
  })
);

// PUT /produtos/{id} - atualiza (ADMIN/GERENTE)
router.put(
  '/:id',
  autenticar,
  autorizar(Perfil.ADMIN, Perfil.GERENTE),
  validate(idParamSchema, 'params'),
  validate(produtoUpdateSchema),
  ah(async (req, res) => {
    res.json(await produtoService.atualizar(req.params.id, req.body));
  })
);

// DELETE /produtos/{id} - desativacao logica (ADMIN)
router.delete(
  '/:id',
  autenticar,
  autorizar(Perfil.ADMIN),
  validate(idParamSchema, 'params'),
  ah(async (req, res) => {
    await produtoService.desativar(req.params.id);
    res.status(204).send();
  })
);

module.exports = router;
