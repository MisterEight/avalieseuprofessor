import pkg from "pg";
import { env } from "../config/env.js";

const { Pool } = pkg;

// Pool configurado via variaveis de ambiente; ajusta conforme .env
export const pool = new Pool({
  host: env.db.host,
  port: env.db.port,
  user: env.db.user,
  password: env.db.password,
  database: env.db.database,
});

export async function healthcheckDb() {
  try {
    await pool.query("SELECT 1");
    return { ok: true };
  } catch (err) {
    return { ok: false, error: err.message };
  }
}
