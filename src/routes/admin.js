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

// Listagens admin (catalogo)
router.get("/admin/instituicoes", async (_req, res) => {
  try {
    const insts = await pool.query("SELECT id, nome FROM institutions ORDER BY nome");
    res.json(insts.rows);
  } catch (err) {
    console.error("listar inst admin", err);
    res.status(500).json({ message: "Erro ao listar instituicoes" });
  }
});

router.get("/admin/departamentos", async (req, res) => {
  const institutionId = req.query.institutionId ? Number(req.query.institutionId) : null;
  const params = [];
  let where = "";
  if (institutionId) {
    params.push(institutionId);
    where = "WHERE d.institution_id = $1";
  }
  try {
    const deps = await pool.query(
      `SELECT d.id, d.nome, d.institution_id, i.nome AS instituicao
       FROM departments d
       JOIN institutions i ON i.id = d.institution_id
       ${where}
       ORDER BY i.nome, d.nome`,
      params,
    );
    res.json(deps.rows);
  } catch (err) {
    console.error("listar deps admin", err);
    res.status(500).json({ message: "Erro ao listar departamentos" });
  }
});

router.get("/admin/professores", async (req, res) => {
  const institutionId = req.query.institutionId ? Number(req.query.institutionId) : null;
  const departmentId = req.query.departmentId ? Number(req.query.departmentId) : null;
  const params = [];
  const where = [];
  if (institutionId) {
    params.push(institutionId);
    where.push(`p.institution_id = $${params.length}`);
  }
  if (departmentId) {
    params.push(departmentId);
    where.push(`p.department_id = $${params.length}`);
  }
  const query = `
    SELECT p.id, p.nome, p.bio, p.institution_id, p.department_id, i.nome AS instituicao, d.nome AS departamento
    FROM professors p
    JOIN institutions i ON i.id = p.institution_id
    LEFT JOIN departments d ON d.id = p.department_id
    ${where.length ? `WHERE ${where.join(" AND ")}` : ""}
    ORDER BY p.id ASC
  `;
  try {
    const result = await pool.query(query, params);
    res.json(result.rows);
  } catch (err) {
    console.error("listar profs admin", err);
    res.status(500).json({ message: "Erro ao listar professores" });
  }
});

// Historico de moderacao
router.get("/admin/avaliacoes/historico", async (req, res) => {
  const status = req.query.status;
  const params = [];
  const where = [];
  if (status) {
    params.push(status);
    where.push(`e.status = $${params.length}`);
  } else {
    where.push(`e.status IN ('aprovada','rejeitada')`);
  }
  const query = `
    SELECT e.id, e.professor_id, e.user_id, e.rating, e.comment, e.status, e.created_at, p.nome AS professor_nome
    FROM evaluations e
    JOIN professors p ON p.id = e.professor_id
    ${where.length ? `WHERE ${where.join(" AND ")}` : ""}
    ORDER BY e.created_at DESC
    LIMIT 100
  `;
  try {
    const result = await pool.query(query, params);
    res.json(result.rows);
  } catch (err) {
    console.error("historico moderacao", err);
    res.status(500).json({ message: "Erro ao listar historico" });
  }
});

router.get("/admin/stats", async (_req, res) => {
  try {
    const users = await pool.query("SELECT COUNT(*) AS total FROM users");
    const profs = await pool.query("SELECT COUNT(*) AS total FROM professors");
    const avals = await pool.query("SELECT COUNT(*) AS total, COUNT(*) FILTER (WHERE status='aprovada') AS aprovadas FROM evaluations");
    res.json({
      users: Number(users.rows[0].total),
      professores: Number(profs.rows[0].total),
      avaliacoes: Number(avals.rows[0].total),
      avaliacoesAprovadas: Number(avals.rows[0].aprovadas),
    });
  } catch (err) {
    console.error("stats", err);
    res.status(500).json({ message: "Erro ao obter stats" });
  }
});

export default router;
