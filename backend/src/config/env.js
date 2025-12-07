import dotenv from 'dotenv';

dotenv.config();

const requiredVars = [
  'DB_PRACTICE_URL',
  'DB_ADMIN_URL',
  'SANDBOX_DB_NAME',
  'JWT_SECRET',
  'ADMIN_USERNAME',
  'ADMIN_PASSWORD',
  'PRACTICE_USERNAME',
  'PRACTICE_PASSWORD'
];

requiredVars.forEach((key) => {
  if (!process.env[key]) {
    throw new Error(`Missing required environment variable: ${key}`);
  }
});

export const config = {
  port: parseInt(process.env.PORT ?? '5000', 10),
  clientOrigin: process.env.CLIENT_ORIGIN,
  rateLimit: {
    windowMs: parseInt(process.env.RATE_LIMIT_WINDOW_MS ?? '60000', 10),
    max: parseInt(process.env.RATE_LIMIT_MAX ?? '50', 10)
  },
  db: {
    practiceUrl: process.env.DB_PRACTICE_URL,
    adminUrl: process.env.DB_ADMIN_URL,
    sandboxDbName: process.env.SANDBOX_DB_NAME
  },
  auth: {
    jwtSecret: process.env.JWT_SECRET,
    tokenExpiry: process.env.TOKEN_EXPIRY ?? '1h',
    users: [
      {
        username: process.env.ADMIN_USERNAME,
        password: process.env.ADMIN_PASSWORD,
        role: 'admin'
      },
      {
        username: process.env.PRACTICE_USERNAME,
        password: process.env.PRACTICE_PASSWORD,
        role: 'practice'
      }
    ]
  }
};
