// Rotas de fidelidade e LGPD (/fidelidade)
const { Router } = require('express');
const ah = require('../utils/asyncHandler');
const { validate } = require('../middlewares/validate');
const { autenticar, autorizar } = require('../middlewares/auth');
const { resgateSchema, consentimentoSchema } = require('../validators/schemas');
const { Perfil } = require('../../domain/enums');
const fidelidadeService = require('../../application/fidelidadeService');

const router = Router();

// GET /fidelidade/saldo - saldo e historico do cliente autenticado
router.get(
  '/saldo',
  autenticar,
  autorizar(Perfil.CLIENTE),
  ah(async (req, res) => {
    res.json(await fidelidadeService.obterConta(req.usuario.id));
  })
);

// POST /fidelidade/consentimento - registra consentimento LGPD
router.post(
  '/consentimento',
  autenticar,
  autorizar(Perfil.CLIENTE),
  validate(consentimentoSchema),
  ah(async (req, res) => {
    res.json(
      await fidelidadeService.registrarConsentimento(req.usuario.id, req.body.consentir, { ip: req.ip })
    );
  })
);

// POST /fidelidade/resgate - resgata pontos
router.post(
  '/resgate',
  autenticar,
  autorizar(Perfil.CLIENTE),
  validate(resgateSchema),
  ah(async (req, res) => {
    res.json(await fidelidadeService.resgatar(req.usuario.id, req.body.pontos, { ip: req.ip }));
  })
);

module.exports = router;
