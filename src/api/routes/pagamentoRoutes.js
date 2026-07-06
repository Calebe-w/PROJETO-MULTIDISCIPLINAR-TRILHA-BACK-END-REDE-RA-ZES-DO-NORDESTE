// Rotas de pagamento (/pagamentos)
const { Router } = require('express');
const ah = require('../utils/asyncHandler');
const { validate } = require('../middlewares/validate');
const { autenticar, autorizar } = require('../middlewares/auth');
const { pagamentoSchema, idParamSchema } = require('../validators/schemas');
const { Perfil } = require('../../domain/enums');
const pagamentoService = require('../../application/pagamentoService');

const router = Router();

// POST /pagamentos - solicita pagamento ao gateway externo (mock)
router.post(
  '/',
  autenticar,
  autorizar(Perfil.CLIENTE, Perfil.ATENDENTE, Perfil.ADMIN),
  validate(pagamentoSchema),
  ah(async (req, res) => {
    const resultado = await pagamentoService.processar(req.body, {
      usuarioId: req.usuario.id,
      perfil: req.usuario.perfil,
      ip: req.ip,
    });
    // 200: a requisicao foi processada; o "statusPagamento" indica APROVADO/RECUSADO.
    res.status(200).json(resultado);
  })
);

// GET /pagamentos/pedido/{id} - historico de pagamentos de um pedido
router.get(
  '/pedido/:id',
  autenticar,
  validate(idParamSchema, 'params'),
  ah(async (req, res) => {
    res.json(await pagamentoService.consultarPorPedido(req.params.id));
  })
);

module.exports = router;
