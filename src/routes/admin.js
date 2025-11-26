import { Router } from "express";
import { pool } from "../db/pool.js";
import { requireAdmin } from "../middleware/auth.js";

const router = Router();

router.use(requireAdmin);

router.get("/admin/avaliacoes/pendentes", async (_req, res) => {
  const query = `
    SELECT e.id, e.professor_id, e.user_id, e.rating, e.comment, e.created_at,
           p.nome AS professor_nome
    FROM evaluations e
    JOIN professors p ON p.id = e.professor_id
    WHERE e.status = 'pendente'
    ORDER BY e.created_at DESC
  `;
  try {
    const result = await pool.query(query);
    res.json({ total: result.rowCount, itens: result.rows });
  } catch (err) {
    console.error("pendentes admin", err);
    res.status(500).json({ message: "Erro ao listar pendentes" });
  }
});

router.post("/admin/avaliacoes/:id/aprovar", async (req, res) => {
  const id = Number(req.params.id);
  if (!id) {
    return res.status(400).json({ message: "ID invalido" });
  }
  try {
    const result = await pool.query(
      "UPDATE evaluations SET status = 'aprovada' WHERE id = $1 RETURNING id, professor_id, rating, comment, status",
      [id],
    );
    if (result.rowCount === 0) {
      return res.status(404).json({ message: "Avaliacao nao encontrada" });
    }
    res.json({ message: `Avaliacao ${id} aprovada`, avaliacao: result.rows[0] });
  } catch (err) {
    console.error("aprovar avaliacao", err);
    res.status(500).json({ message: "Erro ao aprovar avaliacao" });
  }
});

router.post("/admin/avaliacoes/:id/rejeitar", async (req, res) => {
  const id = Number(req.params.id);
  if (!id) {
    return res.status(400).json({ message: "ID invalido" });
  }
  const { motivo } = req.body || {};
  try {
    const result = await pool.query(
      "UPDATE evaluations SET status = 'rejeitada' WHERE id = $1 RETURNING id, professor_id, rating, comment, status",
      [id],
    );
    if (result.rowCount === 0) {
      return res.status(404).json({ message: "Avaliacao nao encontrada" });
    }
    res.json({ message: `Avaliacao ${id} rejeitada`, motivo: motivo || "Sem motivo informado", avaliacao: result.rows[0] });
  } catch (err) {
    console.error("rejeitar avaliacao", err);
    res.status(500).json({ message: "Erro ao rejeitar avaliacao" });
  }
});

// Instituicoes
router.post("/admin/instituicoes", async (req, res) => {
  const { nome } = req.body || {};
  if (!nome) return res.status(400).json({ message: "Nome obrigatorio" });
  try {
    const result = await pool.query("INSERT INTO institutions (nome) VALUES ($1) RETURNING id, nome", [nome]);
    res.status(201).json(result.rows[0]);
  } catch (err) {
    if (err.code === "23505") return res.status(409).json({ message: "Instituicao ja existe" });
    console.error("criar instituicao", err);
    res.status(500).json({ message: "Erro ao criar instituicao" });
  }
});

router.patch("/admin/instituicoes/:id", async (req, res) => {
  const id = Number(req.params.id);
  const { nome } = req.body || {};
  if (!id) return res.status(400).json({ message: "ID invalido" });
  if (!nome) return res.status(400).json({ message: "Nome obrigatorio" });
  try {
    const result = await pool.query(
      "UPDATE institutions SET nome = $1 WHERE id = $2 RETURNING id, nome",
      [nome, id],
    );
    if (result.rowCount === 0) return res.status(404).json({ message: "Instituicao nao encontrada" });
    res.json(result.rows[0]);
  } catch (err) {
    if (err.code === "23505") return res.status(409).json({ message: "Instituicao ja existe" });
    console.error("atualizar instituicao", err);
    res.status(500).json({ message: "Erro ao atualizar instituicao" });
  }
});

router.delete("/admin/instituicoes/:id", async (req, res) => {
  const id = Number(req.params.id);
  if (!id) return res.status(400).json({ message: "ID invalido" });
  try {
    const result = await pool.query("DELETE FROM institutions WHERE id = $1 RETURNING id", [id]);
    if (result.rowCount === 0) return res.status(404).json({ message: "Instituicao nao encontrada" });
    res.json({ message: "Instituicao removida" });
  } catch (err) {
    console.error("deletar instituicao", err);
    res.status(500).json({ message: "Erro ao deletar instituicao" });
  }
});

// Departamentos
router.post("/admin/departamentos", async (req, res) => {
  const { institutionId, nome } = req.body || {};
  if (!institutionId || !nome) {
    return res.status(400).json({ message: "institutionId e nome sao obrigatorios" });
  }
  try {
    const inst = await pool.query("SELECT id FROM institutions WHERE id = $1", [institutionId]);
    if (inst.rowCount === 0) return res.status(404).json({ message: "Instituicao nao encontrada" });
    const result = await pool.query(
      "INSERT INTO departments (institution_id, nome) VALUES ($1, $2) RETURNING id, institution_id, nome",
      [institutionId, nome],
    );
    res.status(201).json(result.rows[0]);
  } catch (err) {
    if (err.code === "23505") return res.status(409).json({ message: "Departamento ja existe nesta instituicao" });
    console.error("criar departamento", err);
    res.status(500).json({ message: "Erro ao criar departamento" });
  }
});

router.patch("/admin/departamentos/:id", async (req, res) => {
  const id = Number(req.params.id);
  const { nome } = req.body || {};
  if (!id) return res.status(400).json({ message: "ID invalido" });
  if (!nome) return res.status(400).json({ message: "Nome obrigatorio" });
  try {
    const result = await pool.query(
      "UPDATE departments SET nome = $1 WHERE id = $2 RETURNING id, institution_id, nome",
      [nome, id],
    );
    if (result.rowCount === 0) return res.status(404).json({ message: "Departamento nao encontrado" });
    res.json(result.rows[0]);
  } catch (err) {
    if (err.code === "23505") return res.status(409).json({ message: "Departamento duplicado para a instituicao" });
    console.error("atualizar departamento", err);
    res.status(500).json({ message: "Erro ao atualizar departamento" });
  }
});

router.delete("/admin/departamentos/:id", async (req, res) => {
  const id = Number(req.params.id);
  if (!id) return res.status(400).json({ message: "ID invalido" });
  try {
    const result = await pool.query("DELETE FROM departments WHERE id = $1 RETURNING id", [id]);
    if (result.rowCount === 0) return res.status(404).json({ message: "Departamento nao encontrado" });
    res.json({ message: "Departamento removido" });
  } catch (err) {
    console.error("deletar departamento", err);
    res.status(500).json({ message: "Erro ao deletar departamento" });
  }
});

// Professores
router.post("/admin/professores", async (req, res) => {
  const { nome, institutionId, departmentId, bio } = req.body || {};
  if (!nome || !institutionId) {
    return res.status(400).json({ message: "nome e institutionId sao obrigatorios" });
  }
  try {
    const inst = await pool.query("SELECT id FROM institutions WHERE id = $1", [institutionId]);
    if (inst.rowCount === 0) return res.status(404).json({ message: "Instituicao nao encontrada" });

    if (departmentId) {
      const dep = await pool.query("SELECT id, institution_id FROM departments WHERE id = $1", [departmentId]);
      if (dep.rowCount === 0) return res.status(404).json({ message: "Departamento nao encontrado" });
      if (dep.rows[0].institution_id !== Number(institutionId)) {
        return res.status(400).json({ message: "Departamento nao pertence a instituicao informada" });
      }
    }

    const result = await pool.query(
      "INSERT INTO professors (nome, institution_id, department_id, bio) VALUES ($1, $2, $3, $4) RETURNING id, nome, institution_id, department_id, bio",
      [nome, institutionId, departmentId || null, bio || null],
    );
    res.status(201).json(result.rows[0]);
  } catch (err) {
    console.error("criar professor", err);
    res.status(500).json({ message: "Erro ao criar professor" });
  }
});

router.patch("/admin/professores/:id", async (req, res) => {
  const id = Number(req.params.id);
  const { nome, institutionId, departmentId, bio } = req.body || {};
  if (!id) return res.status(400).json({ message: "ID invalido" });

  try {
    if (institutionId) {
      const inst = await pool.query("SELECT id FROM institutions WHERE id = $1", [institutionId]);
      if (inst.rowCount === 0) return res.status(404).json({ message: "Instituicao nao encontrada" });
    }
    if (departmentId) {
      const dep = await pool.query("SELECT id, institution_id FROM departments WHERE id = $1", [departmentId]);
      if (dep.rowCount === 0) return res.status(404).json({ message: "Departamento nao encontrado" });
      if (institutionId && dep.rows[0].institution_id !== Number(institutionId)) {
        return res.status(400).json({ message: "Departamento nao pertence a instituicao informada" });
      }
    }

    const result = await pool.query(
      `UPDATE professors
       SET nome = COALESCE($1, nome),
           institution_id = COALESCE($2, institution_id),
           department_id = COALESCE($3, department_id),
           bio = COALESCE($4, bio)
       WHERE id = $5
       RETURNING id, nome, institution_id, department_id, bio`,
      [nome || null, institutionId || null, departmentId || null, bio || null, id],
    );
    if (result.rowCount === 0) return res.status(404).json({ message: "Professor nao encontrado" });
    res.json(result.rows[0]);
  } catch (err) {
    console.error("atualizar professor", err);
    res.status(500).json({ message: "Erro ao atualizar professor" });
  }
});

router.delete("/admin/professores/:id", async (req, res) => {
  const id = Number(req.params.id);
  if (!id) return res.status(400).json({ message: "ID invalido" });
  try {
    const result = await pool.query("DELETE FROM professors WHERE id = $1 RETURNING id", [id]);
    if (result.rowCount === 0) return res.status(404).json({ message: "Professor nao encontrado" });
    res.json({ message: "Professor removido" });
  } catch (err) {
    console.error("deletar professor", err);
    res.status(500).json({ message: "Erro ao deletar professor" });
  }
});

export default router;
