import { Router } from "express";
import { pool } from "../db/pool.js";
import { requireAuth } from "../middleware/auth.js";

const router = Router();

router.post("/professores/:id/avaliacoes", requireAuth, async (req, res) => {
  const professorId = Number(req.params.id);
  const { nota, comentario } = req.body || {};

  if (!professorId) {
    return res.status(400).json({ message: "ProfessorId invalido" });
  }
  if (nota == null || Number.isNaN(Number(nota))) {
    return res.status(400).json({ message: "Nota e obrigatoria" });
  }
  const rating = Number(nota);
  if (rating < 1 || rating > 5) {
    return res.status(400).json({ message: "Nota deve estar entre 1 e 5" });
  }

  try {
    const prof = await pool.query("SELECT id FROM professors WHERE id = $1", [professorId]);
    if (prof.rowCount === 0) {
      return res.status(404).json({ message: "Professor nao encontrado" });
    }

    const result = await pool.query(
      "INSERT INTO evaluations (professor_id, user_id, rating, comment, status) VALUES ($1, $2, $3, $4, 'pendente') RETURNING *",
      [professorId, req.user.id, rating, comentario || null],
    );

    res.status(201).json({
      message: "Avaliacao enviada e pendente de moderacao",
      avaliacao: result.rows[0],
    });
  } catch (err) {
    console.error("criar avaliacao", err);
    res.status(500).json({ message: "Erro ao criar avaliacao" });
  }
});

router.get("/avaliacoes/:id", async (req, res) => {
  const id = Number(req.params.id);
  if (!id) {
    return res.status(400).json({ message: "ID invalido" });
  }

  const query = `
    SELECT e.id, e.professor_id, e.user_id, e.rating, e.comment, e.status, e.created_at,
           p.nome AS professor_nome
    FROM evaluations e
    JOIN professors p ON p.id = e.professor_id
    WHERE e.id = $1
  `;

  try {
    const result = await pool.query(query, [id]);
    if (result.rowCount === 0) {
      return res.status(404).json({ message: "Avaliacao nao encontrada" });
    }
    res.json(result.rows[0]);
  } catch (err) {
    console.error("detalhar avaliacao", err);
    res.status(500).json({ message: "Erro ao detalhar avaliacao" });
  }
});

router.get("/me/avaliacoes", requireAuth, async (req, res) => {
  const page = Number(req.query.page || 1);
  const perPage = Math.min(Number(req.query.perPage || 10), 50);
  const offset = (page - 1) * perPage;

  const query = `
    SELECT e.id, e.professor_id, e.rating, e.comment, e.status, e.created_at, p.nome AS professor_nome
    FROM evaluations e
    JOIN professors p ON p.id = e.professor_id
    WHERE e.user_id = $1
    ORDER BY e.created_at DESC
    LIMIT $2 OFFSET $3
  `;
  const countQuery = `SELECT COUNT(*) AS total FROM evaluations WHERE user_id = $1`;

  try {
    const [list, count] = await Promise.all([
      pool.query(query, [req.user.id, perPage, offset]),
      pool.query(countQuery, [req.user.id]),
    ]);
    res.json({
      page,
      perPage,
      total: Number(count.rows[0].total),
      itens: list.rows,
    });
  } catch (err) {
    console.error("listar minhas avaliacoes", err);
    res.status(500).json({ message: "Erro ao listar avaliacoes" });
  }
});

router.get("/avaliacoes/:id/confirmacao", async (req, res) => {
  const id = Number(req.params.id);
  if (!id) return res.status(400).json({ message: "ID invalido" });
  const query = `
    SELECT id, professor_id, user_id, rating, status, created_at
    FROM evaluations
    WHERE id = $1
  `;
  try {
    const result = await pool.query(query, [id]);
    if (result.rowCount === 0) return res.status(404).json({ message: "Avaliacao nao encontrada" });
    res.json({ confirmacao: result.rows[0] });
  } catch (err) {
    console.error("confirmacao avaliacao", err);
    res.status(500).json({ message: "Erro ao confirmar avaliacao" });
  }
});

router.patch("/avaliacoes/:id", requireAuth, async (req, res) => {
  const id = Number(req.params.id);
  const { nota, comentario } = req.body || {};
  if (!id) return res.status(400).json({ message: "ID invalido" });
  if (nota != null && (Number(nota) < 1 || Number(nota) > 5)) {
    return res.status(400).json({ message: "Nota deve estar entre 1 e 5" });
  }

  try {
    const existing = await pool.query("SELECT id, user_id, status FROM evaluations WHERE id = $1", [id]);
    if (existing.rowCount === 0) return res.status(404).json({ message: "Avaliacao nao encontrada" });
    if (existing.rows[0].user_id !== req.user.id) {
      return res.status(403).json({ message: "Somente o autor pode editar" });
    }

    const result = await pool.query(
      `UPDATE evaluations
       SET rating = COALESCE($1, rating),
           comment = COALESCE($2, comment),
           status = 'pendente'
       WHERE id = $3
       RETURNING id, professor_id, user_id, rating, comment, status, created_at`,
      [nota != null ? Number(nota) : null, comentario || null, id],
    );
    res.json({ message: "Avaliacao atualizada e enviada para moderacao", avaliacao: result.rows[0] });
  } catch (err) {
    console.error("editar avaliacao", err);
    res.status(500).json({ message: "Erro ao editar avaliacao" });
  }
});

router.delete("/avaliacoes/:id", requireAuth, async (req, res) => {
  const id = Number(req.params.id);
  if (!id) return res.status(400).json({ message: "ID invalido" });
  try {
    const existing = await pool.query("SELECT id, user_id FROM evaluations WHERE id = $1", [id]);
    if (existing.rowCount === 0) return res.status(404).json({ message: "Avaliacao nao encontrada" });
    if (existing.rows[0].user_id !== req.user.id) {
      return res.status(403).json({ message: "Somente o autor pode remover" });
    }
    await pool.query("DELETE FROM evaluations WHERE id = $1", [id]);
    res.json({ message: "Avaliacao removida" });
  } catch (err) {
    console.error("remover avaliacao", err);
    res.status(500).json({ message: "Erro ao remover avaliacao" });
  }
});

export default router;
