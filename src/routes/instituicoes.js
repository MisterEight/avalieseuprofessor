import { Router } from "express";
import { pool } from "../db/pool.js";

const router = Router();

router.get("/instituicoes", async (_req, res) => {
  const query = "SELECT id, nome FROM institutions ORDER BY nome ASC";
  try {
    const result = await pool.query(query);
    res.json(result.rows);
  } catch (err) {
    console.error("listar instituicoes", err);
    res.status(500).json({ message: "Erro ao listar instituicoes" });
  }
});

router.get("/instituicoes/:id/departamentos", async (req, res) => {
  const id = Number(req.params.id);
  if (!id) {
    return res.status(400).json({ message: "ID invalido" });
  }

  const query = `
    SELECT id, nome
    FROM departments
    WHERE institution_id = $1
    ORDER BY nome ASC
  `;

  try {
    const deps = await pool.query(query, [id]);
    if (deps.rowCount === 0) {
      return res.status(404).json({ message: "Instituicao nao encontrada ou sem departamentos" });
    }
    res.json(deps.rows);
  } catch (err) {
    console.error("listar departamentos", err);
    res.status(500).json({ message: "Erro ao listar departamentos" });
  }
});

export default router;
