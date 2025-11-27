import { Router } from "express";
import { pool } from "../db/pool.js";

const router = Router();

router.get("/", async (req, res) => {
  const { nome, instituicao, departamento, avaliacaoMinima, instituicaoId, departamentoId } = req.query;
  const params = [];
  const where = [];
  const having = [];

  if (nome) {
    params.push(`%${nome}%`);
    where.push(`p.nome ILIKE $${params.length}`);
  }
  if (instituicao) {
    params.push(`%${instituicao}%`);
    where.push(`i.nome ILIKE $${params.length}`);
  }
  if (departamento) {
    params.push(`%${departamento}%`);
    where.push(`d.nome ILIKE $${params.length}`);
  }
  if (instituicaoId) {
    params.push(Number(instituicaoId));
    where.push(`p.institution_id = $${params.length}`);
  }
  if (departamentoId) {
    params.push(Number(departamentoId));
    where.push(`p.department_id = $${params.length}`);
  }
  if (avaliacaoMinima) {
    params.push(Number(avaliacaoMinima));
    having.push(`COALESCE(AVG(e.rating) FILTER (WHERE e.status = 'aprovada'), 0) >= $${params.length}`);
  }

  const baseQuery = `
    SELECT
      p.id,
      p.nome,
      p.bio,
      i.nome AS instituicao,
      d.nome AS departamento,
      COALESCE(AVG(e.rating) FILTER (WHERE e.status = 'aprovada'), 0) AS media,
      COUNT(e.*) FILTER (WHERE e.status = 'aprovada') AS avaliacoes
    FROM professors p
    JOIN institutions i ON i.id = p.institution_id
    LEFT JOIN departments d ON d.id = p.department_id
    LEFT JOIN evaluations e ON e.professor_id = p.id
    ${where.length ? `WHERE ${where.join(" AND ")}` : ""}
    GROUP BY p.id, i.nome, d.nome
    ${having.length ? `HAVING ${having.join(" AND ")}` : ""}
    ORDER BY p.id ASC
  `;

  try {
    const result = await pool.query(baseQuery, params);
    res.json(result.rows);
  } catch (err) {
    console.error("listar professores", err);
    res.status(500).json({ message: "Erro ao listar professores" });
  }
});

router.get("/top", async (_req, res) => {
  const query = `
    SELECT
      p.id,
      p.nome,
      i.nome AS instituicao,
      d.nome AS departamento,
      COALESCE(AVG(e.rating) FILTER (WHERE e.status = 'aprovada'), 0) AS media,
      COUNT(e.*) FILTER (WHERE e.status = 'aprovada') AS avaliacoes
    FROM professors p
    JOIN institutions i ON i.id = p.institution_id
    LEFT JOIN departments d ON d.id = p.department_id
    LEFT JOIN evaluations e ON e.professor_id = p.id
    GROUP BY p.id, i.nome, d.nome
    ORDER BY media DESC NULLS LAST
    LIMIT 5
  `;
  try {
    const result = await pool.query(query);
    res.json(result.rows);
  } catch (err) {
    console.error("top professores", err);
    res.status(500).json({ message: "Erro ao listar ranking" });
  }
});

router.get("/:id", async (req, res) => {
  const id = Number(req.params.id);
  if (!id) return res.status(400).json({ message: "ID invalido" });

  const query = `
    SELECT
      p.id,
      p.nome,
      p.bio,
      i.nome AS instituicao,
      d.nome AS departamento,
      COALESCE(AVG(e.rating) FILTER (WHERE e.status = 'aprovada'), 0) AS media,
      COUNT(e.*) FILTER (WHERE e.status = 'aprovada') AS avaliacoes
    FROM professors p
    JOIN institutions i ON i.id = p.institution_id
    LEFT JOIN departments d ON d.id = p.department_id
    LEFT JOIN evaluations e ON e.professor_id = p.id
    WHERE p.id = $1
    GROUP BY p.id, i.nome, d.nome
  `;

  try {
    const result = await pool.query(query, [id]);
    if (result.rowCount === 0) {
      return res.status(404).json({ message: "Professor nao encontrado" });
    }
    res.json(result.rows[0]);
  } catch (err) {
    console.error("detalhar professor", err);
    res.status(500).json({ message: "Erro ao detalhar professor" });
  }
});

router.get("/:id/avaliacoes", async (req, res) => {
  const id = Number(req.params.id);
  if (!id) return res.status(400).json({ message: "ID invalido" });

  const page = Number(req.query.page || 1);
  const perPage = Math.min(Number(req.query.perPage || 10), 50);
  const offset = (page - 1) * perPage;

  const professorExists = await pool.query("SELECT 1 FROM professors WHERE id = $1", [id]);
  if (professorExists.rowCount === 0) {
    return res.status(404).json({ message: "Professor nao encontrado" });
  }

  const query = `
    SELECT id, user_id, rating, comment, status, created_at
    FROM evaluations
    WHERE professor_id = $1 AND status = 'aprovada'
    ORDER BY created_at DESC
    LIMIT $2 OFFSET $3
  `;
  const countQuery = `
    SELECT COUNT(*) AS total
    FROM evaluations
    WHERE professor_id = $1 AND status = 'aprovada'
  `;

  try {
    const [avaliacoes, count] = await Promise.all([
      pool.query(query, [id, perPage, offset]),
      pool.query(countQuery, [id]),
    ]);
    res.json({
      professorId: id,
      page,
      perPage,
      total: Number(count.rows[0].total),
      itens: avaliacoes.rows,
    });
  } catch (err) {
    console.error("listar avaliacoes", err);
    res.status(500).json({ message: "Erro ao listar avaliacoes" });
  }
});

export default router;
