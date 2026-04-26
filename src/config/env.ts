import 'dotenv/config'

export const env = {
  PORT: parseInt(process.env.PORT || '5000'),
  MONGODB_URI: process.env.MONGODB_URI || 'mongodb://localhost:27017/pave_art',
  JWT_SECRET: process.env.JWT_SECRET || 'default_secret_change_me',
  NODE_ENV: process.env.NODE_ENV || 'development',
  BCRYPT_ROUNDS: parseInt(process.env.BCRYPT_ROUNDS || '10'),
  CORS_ORIGINS: process.env.CORS_ORIGINS || 'http://localhost:3000,http://localhost:3001'
}
