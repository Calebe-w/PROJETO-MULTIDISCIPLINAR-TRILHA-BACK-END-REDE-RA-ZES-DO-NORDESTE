// Rotas de usuarios e equipe (/usuarios)
const { Router } = require('express');
const ah = require('../utils/asyncHandler');
const { validate } = require('../middlewares/validate');
const { autenticar, autorizar } = require('../middlewares/auth');
const { funcionarioSchema, paginacao } = require('../validators/schemas');
const { Perfil } = require('../../domain/enums');
const usuarioService = require('../../application/usuarioService');

const router = Router();

// GET /usuarios/me - perfil do usuario autenticado
router.get(
  '/me',
  autenticar,
  ah(async (req, res) => {
    const perfil = await usuarioService.meuPerfil(req.usuario.id);
    res.json(perfil);
  })
);

// GET /usuarios - lista (ADMIN)
router.get(
  '/',
  autenticar,
  autorizar(Perfil.ADMIN),
  validate(paginacao, 'query'),
  ah(async (req, res) => {
    const resultado = await usuarioService.listar(req.query);
    res.json(resultado);
  })
);

// POST /usuarios - cria funcionario (ADMIN)
router.post(
  '/',
  autenticar,
  autorizar(Perfil.ADMIN),
  validate(funcionarioSchema),
  ah(async (req, res) => {
    const usuario = await usuarioService.criarFuncionario(req.body, {
      usuarioId: req.usuario.id,
      ip: req.ip,
    });
    res.status(201).json(usuario);
  })
);

module.exports = router;
