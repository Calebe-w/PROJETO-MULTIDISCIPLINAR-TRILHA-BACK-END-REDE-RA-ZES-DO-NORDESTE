// Rotas de autenticacao (/auth)
const { Router } = require('express');
const ah = require('../utils/asyncHandler');
const { validate } = require('../middlewares/validate');
const { registroSchema, loginSchema, refreshSchema } = require('../validators/schemas');
const authService = require('../../application/authService');

const router = Router();

// POST /auth/register - cadastro publico de cliente
router.post(
  '/register',
  validate(registroSchema),
  ah(async (req, res) => {
    const user = await authService.registrarCliente(req.body, { ip: req.ip });
    res.status(201).json(user);
  })
);

// POST /auth/login - autentica e retorna tokens
router.post(
  '/login',
  validate(loginSchema),
  ah(async (req, res) => {
    const resultado = await authService.login(req.body, { ip: req.ip });
    res.status(200).json(resultado);
  })
);

// POST /auth/refresh - troca refresh token por novo access token
router.post(
  '/refresh',
  validate(refreshSchema),
  ah(async (req, res) => {
    const resultado = await authService.refresh(req.body);
    res.status(200).json(resultado);
  })
);

// POST /auth/logout - stateless: cliente apenas descarta o token
router.post('/logout', (_req, res) => {
  res.status(200).json({ message: 'Logout efetuado. Descarte o token no cliente.' });
});

module.exports = router;
