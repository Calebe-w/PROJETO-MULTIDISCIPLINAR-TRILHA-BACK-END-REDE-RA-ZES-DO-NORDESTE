// Servico de auditoria (LGPD / rastreabilidade).
const prisma = require('./prisma');
const logger = require('./logger');

// Registra uma acao sensivel no log.
async function registrar({ usuarioId, acao, entidade, entidadeId, detalhes, ip }) {
  try {
    await prisma.logAuditoria.create({
      data: {
        usuarioId: usuarioId ?? null,
        acao,
        entidade: entidade ?? null,
        entidadeId: entidadeId != null ? String(entidadeId) : null,
        detalhes: detalhes ? JSON.stringify(detalhes) : null,
        ip: ip ?? null,
      },
    });
  } catch (err) {
    // Auditoria nunca deve derrubar o fluxo principal; apenas loga a falha.
    logger.error('Falha ao registrar auditoria', { acao, erro: err.message });
  }
}

module.exports = { registrar };
