// Logger simples (console estruturado).

function log(nivel, mensagem, meta) {
  if (process.env.NODE_ENV === 'test') return; // silencia ruido nos testes
  const linha = {
    nivel,
    mensagem,
    ...(meta ? { meta } : {}),
    timestamp: new Date().toISOString(),
  };
  // eslint-disable-next-line no-console
  console.log(JSON.stringify(linha));
}

module.exports = {
  info: (m, meta) => log('INFO', m, meta),
  warn: (m, meta) => log('WARN', m, meta),
  error: (m, meta) => log('ERROR', m, meta),
};
