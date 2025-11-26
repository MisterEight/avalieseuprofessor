import dotenv from "dotenv";

dotenv.config();

export const env = {
  port: process.env.PORT || 3000,
  jwtSecret: process.env.JWT_SECRET || "dev-secret-change-me",
  jwtExpiresIn: process.env.JWT_EXPIRES_IN || "7d",
  db: {
    host: process.env.PGHOST || "localhost",
    port: Number(process.env.PGPORT || process.env.POSTGRES_PORT || 5432),
    user: process.env.PGUSER || process.env.POSTGRES_USER || "avaliaprof_user",
    password: process.env.PGPASSWORD || process.env.POSTGRES_PASSWORD || "avaliaprof_pass",
    database: process.env.PGDATABASE || process.env.POSTGRES_DB || "avaliaprof",
  },
};
