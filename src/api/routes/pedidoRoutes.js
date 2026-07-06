// Rotas de pedidos (/pedidos)
const { Router } = require('express');
const ah = require('../utils/asyncHandler');
const { validate } = require('../middlewares/validate');
const { autenticar, autorizar } = require('../middlewares/auth');
const {
  pedidoSchema,
  pedidoQuerySchema,
  statusSchema,
  idParamSchema,
} = require('../validators/schemas');
const { Perfil } = require('../../domain/enums');
const pedidoService = require('../../application/pedidoService');

const router = Router();

function ctx(req) {
  return { usuarioId: req.usuario.id, perfil: req.usuario.perfil, ip: req.ip };
}

// POST /pedidos - cria pedido (CLIENTE). canalPedido obrigatorio.
router.post(
  '/',
  autenticar,
  autorizar(Perfil.CLIENTE, Perfil.ATENDENTE, Perfil.ADMIN),
  validate(pedidoSchema),
  ah(async (req, res) => {
    const pedido = await pedidoService.criar(
      { ...req.body, clienteId: req.usuario.id },
      ctx(req)
    );
    res.status(201).json(pedido);
  })
);

// GET /pedidos - lista/filtra por canal e status
router.get(
  '/',
  autenticar,
  validate(pedidoQuerySchema, 'query'),
  ah(async (req, res) => {
    res.json(await pedidoService.listar(req.query, ctx(req)));
  })
);

// GET /pedidos/{id}
router.get(
  '/:id',
  autenticar,
  validate(idParamSchema, 'params'),
  ah(async (req, res) => {
    res.json(await pedidoService.buscarPorId(req.params.id, ctx(req)));
  })
);

// PATCH /pedidos/{id}/status - atualiza status (equipe)
router.patch(
  '/:id/status',
  autenticar,
  autorizar(Perfil.ADMIN, Perfil.GERENTE, Perfil.ATENDENTE, Perfil.COZINHA),
  validate(idParamSchema, 'params'),
  validate(statusSchema),
  ah(async (req, res) => {
    const pedido = await pedidoService.atualizarStatus(req.params.id, req.body.status, ctx(req));
    res.json(pedido);
  })
);

module.exports = router;
