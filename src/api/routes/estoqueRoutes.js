// Rotas de controle de estoque (/estoque)
const { Router } = require('express');
const ah = require('../utils/asyncHandler');
const { validate } = require('../middlewares/validate');
const { autenticar, autorizar } = require('../middlewares/auth');
const { movimentacaoSchema, idParamSchema } = require('../validators/schemas');
const { Perfil } = require('../../domain/enums');
const estoqueService = require('../../application/estoqueService');

const router = Router();

// GET /estoque/unidade/{id} - saldo por unidade (ADMIN/GERENTE/ATENDENTE)
router.get(
  '/unidade/:id',
  autenticar,
  autorizar(Perfil.ADMIN, Perfil.GERENTE, Perfil.ATENDENTE),
  validate(idParamSchema, 'params'),
  ah(async (req, res) => {
    res.json(await estoqueService.consultarPorUnidade(req.params.id));
  })
);

// POST /estoque/movimentacoes - entrada/saida (ADMIN/GERENTE)
router.post(
  '/movimentacoes',
  autenticar,
  autorizar(Perfil.ADMIN, Perfil.GERENTE),
  validate(movimentacaoSchema),
  ah(async (req, res) => {
    const resultado = await estoqueService.movimentar(req.body, {
      usuarioId: req.usuario.id,
      ip: req.ip,
    });
    res.status(201).json(resultado);
  })
);

module.exports = router;
