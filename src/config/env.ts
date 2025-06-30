import dotenv from 'dotenv';

dotenv.config();

const envVars = process.env;

const config = {
  nodeEnv: envVars.NODE_ENV ?? envVars.ENV,
  port: parseInt(envVars.PORT) || 8000,
  dbUrl: envVars.DATABASE_URL,
};

export default config;
