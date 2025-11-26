import { Router } from "express";
import { pool } from "../db/pool.js";
import { hashPassword, verifyPassword } from "../utils/password.js";
import { requireAuth, signToken } from "../middleware/auth.js";

const router = Router();

router.post("/auth/register", async (req, res) => {
  const { email, password, nome } = req.body || {};
  if (!email || !password) {
    return res.status(400).json({ message: "Email e senha sao obrigatorios" });
  }

  try {
    const existing = await pool.query("SELECT id FROM users WHERE email = $1", [email]);
    if (existing.rowCount > 0) {
      return res.status(409).json({ message: "Email ja cadastrado" });
    }

    const passwordHash = await hashPassword(password);
    const result = await pool.query(
      "INSERT INTO users (nome, email, password_hash, role) VALUES ($1, $2, $3, $4) RETURNING id, nome, email, role",
      [nome || null, email, passwordHash, "student"],
    );

    const user = result.rows[0];
    const token = signToken({ id: user.id, email: user.email, role: user.role, nome: user.nome });
    res.status(201).json({ message: "Usuario registrado", user, token });
  } catch (err) {
    console.error("register error", err);
    res.status(500).json({ message: "Erro ao registrar usuario" });
  }
});

router.post("/auth/login", async (req, res) => {
  const { email, password } = req.body || {};
  if (!email || !password) {
    return res.status(400).json({ message: "Email e senha sao obrigatorios" });
  }

  try {
    const result = await pool.query("SELECT id, nome, email, role, password_hash FROM users WHERE email = $1", [email]);
    if (result.rowCount === 0) {
      return res.status(401).json({ message: "Credenciais invalidas" });
    }
    const user = result.rows[0];
    const ok = await verifyPassword(password, user.password_hash);
    if (!ok) {
      return res.status(401).json({ message: "Credenciais invalidas" });
    }
    delete user.password_hash;
    const token = signToken({ id: user.id, email: user.email, role: user.role, nome: user.nome });
    res.json({ user, token });
  } catch (err) {
    console.error("login error", err);
    res.status(500).json({ message: "Erro ao autenticar" });
  }
});

router.post("/auth/logout", (_req, res) => {
  res.json({ message: "Logout efetuado (stateless)" });
});

router.get("/auth/me", requireAuth, async (req, res) => {
  try {
    const result = await pool.query("SELECT id, nome, email, role FROM users WHERE id = $1", [req.user.id]);
    if (result.rowCount === 0) {
      return res.status(404).json({ message: "Usuario nao encontrado" });
    }
    res.json({ user: result.rows[0] });
  } catch (err) {
    console.error("me error", err);
    res.status(500).json({ message: "Erro ao recuperar usuario" });
  }
});

export default router;
