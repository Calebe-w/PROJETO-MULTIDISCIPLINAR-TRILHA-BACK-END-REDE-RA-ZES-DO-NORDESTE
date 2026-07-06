// Carrega variaveis de ambiente e expoe a configuracao tipada.
require('dotenv').config();

const env = {
  port: Number(process.env.PORT) || 3000,
  databaseUrl: process.env.DATABASE_URL,
  jwtSecret: process.env.JWT_SECRET,
  jwtExpiresIn: process.env.JWT_EXPIRES_IN || '1h',
  jwtRefreshExpiresIn: process.env.JWT_REFRESH_EXPIRES_IN || '7d',
  nodeEnv: process.env.NODE_ENV || 'development',
};

if (!env.jwtSecret) {
  throw new Error('JWT_SECRET nao definido. Copie .env.example para .env.');
}
if (!env.databaseUrl) {
  throw new Error('DATABASE_URL nao definido. Copie .env.example para .env.');
}

module.exports = env;
