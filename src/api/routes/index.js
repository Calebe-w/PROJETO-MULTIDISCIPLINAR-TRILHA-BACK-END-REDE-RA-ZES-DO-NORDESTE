// Agregador de rotas (monta /api/...).
const { Router } = require('express');

const router = Router();

router.use('/auth', require('./authRoutes'));
router.use('/usuarios', require('./usuarioRoutes'));
router.use('/unidades', require('./unidadeRoutes'));
router.use('/produtos', require('./produtoRoutes'));
router.use('/estoque', require('./estoqueRoutes'));
router.use('/pedidos', require('./pedidoRoutes'));
router.use('/pagamentos', require('./pagamentoRoutes'));
router.use('/fidelidade', require('./fidelidadeRoutes'));

module.exports = router;
