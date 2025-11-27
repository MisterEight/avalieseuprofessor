import { useEffect, useMemo, useState } from "react";
import { BrowserRouter, Link, Route, Routes, useNavigate, useParams } from "react-router-dom";
import { AuthProvider, useAuth } from "./AuthContext.jsx";
import { api } from "./api.js";
import "./App.css";
import InstituicoesPage from "./components/InstituicoesPage.jsx";

function Navbar() {
  const { user, logout } = useAuth();
  return (
    <div className="page">
      <div className="flex between" style={{ color: "white", padding: "8px 0" }}>
        <Link to="/" style={{ fontWeight: 800 }}>Avalie Seu Professor</Link>
        <div className="flex" style={{ gap: 8 }}>
          {user ? (
            <>
              <span className="muted" style={{ color: "#dbe4f0" }}>
                {user.nome || "Sem nome"} ({user.role})
              </span>
              <Link className="btn secondary" to="/minhas-avaliacoes">Minhas avaliacoes</Link>
              <button className="btn secondary" onClick={logout}>Sair</button>
              <Link className="btn primary" to="/admin">Admin</Link>
            </>
          ) : (
            <>
              <Link className="btn secondary" to="/login">Login</Link>
              <Link className="btn primary" to="/register">Criar conta</Link>
            </>
          )}
        </div>
      </div>
    </div>
  );
}

function Hero() {
  return (
    <header className="hero">
      <div className="page">
        <h1 style={{ margin: 0, fontSize: 42, fontWeight: 800 }}>Encontre e avalie professores com transparencia</h1>
        <p style={{ maxWidth: 680, color: "#dce4ec", fontSize: 18 }}>
          Busque por instituicao, departamento ou nome. Envie avaliacoes autenticadas e acompanhe o ranking.
        </p>
        <div className="flex" style={{ gap: 12, marginTop: 12 }}>
          <a className="btn primary" href="#professores">Ver professores</a>
          <a className="btn secondary" href="#professores">Ver ranking</a>
        </div>
      </div>
    </header>
  );
}

function LoginPage() {
  const { login } = useAuth();
  const navigate = useNavigate();
  const [form, setForm] = useState({ email: "aluno@exemplo.com", password: "123456" });
  const [msg, setMsg] = useState("");

  const onSubmit = async (e) => {
    e.preventDefault();
    setMsg("");
    try {
      await login(form.email, form.password);
      navigate("/");
    } catch (err) {
      setMsg(err.message);
    }
  };

  return (
    <div className="page" style={{ marginTop: 24 }}>
      <div className="shell" style={{ maxWidth: 520, margin: "0 auto" }}>
        <h3>Login</h3>
        <form className="grid" style={{ gap: 12 }} onSubmit={onSubmit}>
          <input className="input" placeholder="Email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} />
          <input className="input" type="password" placeholder="Senha" value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })} />
          <button className="btn primary" type="submit">Entrar</button>
        </form>
        {msg && <div className="muted" style={{ marginTop: 8 }}>{msg}</div>}
        <div className="muted" style={{ marginTop: 12 }}>Ainda não tem conta? <Link to="/register">Registre-se</Link></div>
      </div>
    </div>
  );
}

function RegisterPage() {
  const { register } = useAuth();
  const navigate = useNavigate();
  const [form, setForm] = useState({ email: "", password: "", nome: "" });
  const [msg, setMsg] = useState("");

  const onSubmit = async (e) => {
    e.preventDefault();
    setMsg("");
    try {
      await register(form);
      navigate("/");
    } catch (err) {
      setMsg(err.message);
    }
  };

  return (
    <div className="page" style={{ marginTop: 24 }}>
      <div className="shell" style={{ maxWidth: 520, margin: "0 auto" }}>
        <h3>Criar conta</h3>
        <form className="grid" style={{ gap: 12 }} onSubmit={onSubmit}>
          <input className="input" placeholder="Email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} />
          <input className="input" type="password" placeholder="Senha" value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })} />
          <input className="input" placeholder="Nome (opcional)" value={form.nome} onChange={(e) => setForm({ ...form, nome: e.target.value })} />
          <button className="btn primary" type="submit">Registrar</button>
        </form>
        {msg && <div className="muted" style={{ marginTop: 8 }}>{msg}</div>}
        <div className="muted" style={{ marginTop: 12 }}>Já tem conta? <Link to="/login">Faça login</Link></div>
      </div>
    </div>
  );
}

function ProfessoresSection() {
  const [filtro, setFiltro] = useState({ avaliacaoMinima: 4 });
  const [lista, setLista] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [insts, setInsts] = useState([]);
  const [deps, setDeps] = useState([]);

  const carregar = async () => {
    setLoading(true);
    setError("");
    try {
      const data = await api.professores(filtro);
      setLista(data);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    api.instituicoes().then(setInsts).catch(() => setInsts([]));
    carregar();
  }, []);

  useEffect(() => {
    if (!filtro.instituicaoId) {
      setDeps([]);
      return;
    }
    api.departamentos(filtro.instituicaoId).then(setDeps).catch(() => setDeps([]));
  }, [filtro.instituicaoId]);

  return (
    <section id="professores" className="shell">
      <div className="flex between" style={{ marginBottom: 12 }}>
        <div>
          <div className="muted">Busca</div>
          <h3 className="section-title">Professores</h3>
        </div>
        <button className="btn secondary" onClick={carregar}>Atualizar</button>
      </div>
      <div className="grid" style={{ gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))", gap: 10, marginBottom: 12 }}>
        <input className="input" placeholder="Nome" value={filtro.nome || ""} onChange={(e) => setFiltro({ ...filtro, nome: e.target.value })} />
        <select className="input" value={filtro.instituicaoId || ""} onChange={(e) => setFiltro({ ...filtro, instituicaoId: e.target.value })}>
          <option value="">Instituicao (todas)</option>
          {insts.map((i) => (
            <option key={i.id} value={i.id}>{i.nome}</option>
          ))}
        </select>
        <select className="input" value={filtro.departamentoId || ""} onChange={(e) => setFiltro({ ...filtro, departamentoId: e.target.value })} disabled={!deps.length}>
          <option value="">Departamento (todos)</option>
          {deps.map((d) => (
            <option key={d.id} value={d.id}>{d.nome}</option>
          ))}
        </select>
        <input className="input" type="number" min="1" max="5" step="0.1" placeholder="Avaliacao minima" value={filtro.avaliacaoMinima ?? ""} onChange={(e) => setFiltro({ ...filtro, avaliacaoMinima: e.target.value })} />
        <button className="btn primary" onClick={carregar}>Filtrar</button>
      </div>
      {loading && <div className="muted">Carregando...</div>}
      {error && <div style={{ color: "red" }}>{error}</div>}
      <div className="grid" style={{ gridTemplateColumns: "repeat(auto-fit, minmax(260px, 1fr))", gap: 12 }}>
        {lista.map((p) => (
          <div key={p.id} className="card prof-card">
            <div className="flex between">
              <div>
                <Link to={`/professores/${p.id}`} className="section-title" style={{ fontSize: 18 }}>{p.nome}</Link>
                <div className="muted" style={{ fontSize: 13 }}>{p.instituicao || ""}{p.departamento ? " - " + p.departamento : ""}</div>
              </div>
              <div className="text-end">
                <div className="badge">{Number(p.media || 0).toFixed(1)}</div>
                <div className="muted" style={{ fontSize: 12 }}>{p.avaliacoes || 0} avaliacoes</div>
              </div>
            </div>
            <div className="muted" style={{ marginTop: 6, fontSize: 14 }}>{p.bio || "Sem bio."}</div>
          </div>
        ))}
      </div>
      {!loading && lista.length === 0 && <div className="muted">Nenhum professor encontrado.</div>}
    </section>
  );
}

function TopSection() {
  const [lista, setLista] = useState([]);
  useEffect(() => {
    api.topProfessores().then(setLista).catch(() => setLista([]));
  }, []);
  return (
    <section className="shell">
      <div className="muted">Ranking</div>
      <h3 className="section-title">Top professores</h3>
      <div className="grid" style={{ gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))", gap: 12 }}>
        {lista.map((p) => (
          <div key={p.id} className="card prof-card">
            <div className="flex between">
              <div>
                <Link to={`/professores/${p.id}`} className="section-title" style={{ fontSize: 16 }}>{p.nome}</Link>
                <div className="muted" style={{ fontSize: 12 }}>{p.instituicao || ""}</div>
              </div>
              <span className="badge">{Number(p.media || 0).toFixed(1)}</span>
            </div>
            <div className="muted" style={{ fontSize: 12 }}>{p.departamento || ""}</div>
            <div className="muted" style={{ fontSize: 12 }}>{p.avaliacoes || 0} avaliacoes</div>
          </div>
        ))}
        {lista.length === 0 && <div className="muted">Sem dados</div>}
      </div>
    </section>
  );
}

function AdminPage() {
  const { user, token } = useAuth();
  const [pendentes, setPendentes] = useState([]);
  const [msg, setMsg] = useState("");
  const [profForm, setProfForm] = useState({ nome: "", institutionId: "", departmentId: "", bio: "", id: "" });
  const [insts, setInsts] = useState([]);
  const [deps, setDeps] = useState([]);
  const [profs, setProfs] = useState([]);
  const [hist, setHist] = useState([]);
  const [filters, setFilters] = useState({ institutionId: "", departmentId: "", status: "" });
  const [stats, setStats] = useState(null);

  const isAdmin = user?.role === "admin";
  const loadPendentes = async () => {
    setMsg("");
    try {
      const data = await api.pendentes(token);
      setPendentes(data.itens || []);
    } catch (err) {
      setMsg(err.message);
    }
  };

  const aprovar = async (id) => {
    await api.aprovar(id, token);
    loadPendentes();
  };
  const rejeitar = async (id) => {
    await api.rejeitar(id, "Reprovado", token);
    loadPendentes();
  };

  const salvarProfessor = async (e) => {
    e.preventDefault();
    const payload = {
      nome: profForm.nome,
      institutionId: Number(profForm.institutionId),
      departmentId: profForm.departmentId ? Number(profForm.departmentId) : null,
      bio: profForm.bio || null,
    };
    try {
      await api.salvarProfessor(payload, token, profForm.id ? Number(profForm.id) : undefined);
      setMsg("Professor salvo");
      setProfForm({ nome: "", institutionId: "", departmentId: "", bio: "", id: "" });
    } catch (err) {
      setMsg(err.message);
    }
  };

  const loadCatalogo = async () => {
    try {
      const [is, ds, ps] = await Promise.all([
        api.adminInstituicoes(token),
        api.adminDepartamentos(token, filters.institutionId || undefined),
        api.adminProfessores(token, {
          institutionId: filters.institutionId || undefined,
          departmentId: filters.departmentId || undefined,
        }),
      ]);
      setInsts(is);
      setDeps(ds);
      setProfs(ps);
    } catch (err) {
      setMsg(err.message);
    }
  };

  const loadHistorico = async () => {
    try {
      const data = await api.historicoModeracao(token, filters.status || undefined);
      setHist(data);
    } catch (err) {
      setMsg(err.message);
    }
  };

  const loadStats = async () => {
    try {
      const data = await api.adminStats(token);
      setStats(data);
    } catch (err) {
      setMsg(err.message);
    }
  };

  if (!isAdmin) {
    return (
      <div className="page" style={{ marginTop: 32 }}>
        <div className="shell">
          <h3>Painel admin</h3>
          <p className="muted">Acesso restrito a admin.</p>
        </div>
      </div>
    );
  }

  return (
      <div className="page" style={{ marginTop: 32 }}>
      <div className="shell">
        <div className="flex between">
          <h3>Painel admin</h3>
          <div className="flex" style={{ gap: 8 }}>
            <button className="btn secondary" onClick={loadPendentes}>Pendentes</button>
            <button className="btn secondary" onClick={() => { loadCatalogo(); loadHistorico(); loadStats(); }}>Atualizar catalogo/historico/stats</button>
          </div>
        </div>
        {msg && <div className="muted">{msg}</div>}

        <div className="grid" style={{ gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))", gap: 10, marginTop: 8 }}>
          <div className="card">
            <div className="muted small">Usuarios</div>
            <div className="section-title" style={{ fontSize: 22 }}>{stats ? stats.users : "-"}</div>
          </div>
          <div className="card">
            <div className="muted small">Professores</div>
            <div className="section-title" style={{ fontSize: 22 }}>{stats ? stats.professores : "-"}</div>
          </div>
          <div className="card">
            <div className="muted small">Avaliacoes (total)</div>
            <div className="section-title" style={{ fontSize: 22 }}>{stats ? stats.avaliacoes : "-"}</div>
          </div>
          <div className="card">
            <div className="muted small">Avaliacoes aprovadas</div>
            <div className="section-title" style={{ fontSize: 22 }}>{stats ? stats.avaliacoesAprovadas : "-"}</div>
          </div>
        </div>
      <div className="grid" style={{ gridTemplateColumns: "repeat(auto-fit, minmax(260px, 1fr))", gap: 12, marginTop: 8 }}>
        {pendentes.map((p) => (
          <div key={p.id} className="card">
            <div className="flex between">
              <div>
                  <div className="section-title" style={{ fontSize: 16 }}>Avaliacao {p.id}</div>
                  <div className="muted small">Prof {p.professor_nome}</div>
                </div>
                <span className="badge">{p.rating}</span>
              </div>
              <div className="muted" style={{ fontSize: 13, marginTop: 6 }}>{p.comentario || "Sem comentario"}</div>
              <div className="flex" style={{ marginTop: 8 }}>
                <button className="btn primary" onClick={() => aprovar(p.id)}>Aprovar</button>
                <button className="btn danger" onClick={() => rejeitar(p.id)}>Rejeitar</button>
              </div>
            </div>
          ))}
        {pendentes.length === 0 && <div className="muted">Sem pendencias</div>}
      </div>
    </div>

      <div className="shell" style={{ marginTop: 16 }}>
        <div className="flex between">
          <h4>Catalogo</h4>
          <div className="flex" style={{ gap: 8 }}>
            <select className="input" style={{ width: 180 }} value={filters.institutionId} onChange={(e) => setFilters({ ...filters, institutionId: e.target.value })}>
              <option value="">Todas instituicoes</option>
              {insts.map((i) => <option key={i.id} value={i.id}>{i.nome}</option>)}
            </select>
            <select className="input" style={{ width: 180 }} value={filters.departmentId} onChange={(e) => setFilters({ ...filters, departmentId: e.target.value })}>
              <option value="">Todos departamentos</option>
              {deps.map((d) => <option key={d.id} value={d.id}>{d.nome}</option>)}
            </select>
            <button className="btn secondary" onClick={loadCatalogo}>Aplicar</button>
          </div>
        </div>
        <div className="grid" style={{ gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))", gap: 10, marginTop: 10 }}>
          {profs.map((p) => (
            <div key={p.id} className="card">
              <div className="flex between">
                <div>
                  <div className="section-title" style={{ fontSize: 16 }}>{p.nome}</div>
                  <div className="muted small">{p.instituicao || ""}{p.departamento ? " - " + p.departamento : ""}</div>
                </div>
                <button className="btn secondary" onClick={() => setProfForm({
                  id: p.id,
                  nome: p.nome,
                  institutionId: p.institution_id,
                  departmentId: p.department_id || "",
                  bio: p.bio || "",
                })}>Editar</button>
              </div>
              <div className="muted small">ID {p.id}</div>
            </div>
          ))}
          {profs.length === 0 && <div className="muted">Nenhum professor encontrado.</div>}
        </div>
      </div>

      <div className="shell" style={{ marginTop: 16 }}>
        <h4>Professores (create/update)</h4>
        <form className="grid" style={{ gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", gap: 10 }} onSubmit={salvarProfessor}>
          <input className="input" placeholder="ID (para editar)" value={profForm.id} onChange={(e) => setProfForm({ ...profForm, id: e.target.value })} />
          <input className="input" placeholder="Nome" value={profForm.nome} onChange={(e) => setProfForm({ ...profForm, nome: e.target.value })} />
          <input className="input" placeholder="Institution ID" value={profForm.institutionId} onChange={(e) => setProfForm({ ...profForm, institutionId: e.target.value })} />
          <input className="input" placeholder="Department ID (opcional)" value={profForm.departmentId} onChange={(e) => setProfForm({ ...profForm, departmentId: e.target.value })} />
          <input className="input" placeholder="Bio" value={profForm.bio} onChange={(e) => setProfForm({ ...profForm, bio: e.target.value })} />
          <button className="btn primary" type="submit">Salvar</button>
        </form>
        {profForm.id && (
          <button className="btn danger" style={{ marginTop: 8 }} onClick={async () => {
            try {
              await api.removerProfessor(Number(profForm.id), token);
              setMsg("Professor removido");
              setProfForm({ nome: "", institutionId: "", departmentId: "", bio: "", id: "" });
              loadCatalogo();
            } catch (err) {
              setMsg(err.message);
            }
          }}>Remover</button>
        )}
      </div>

      <div className="shell" style={{ marginTop: 16 }}>
        <div className="flex between">
          <h4>Historico de moderacao</h4>
          <div className="flex" style={{ gap: 8 }}>
            <select className="input" style={{ width: 180 }} value={filters.status} onChange={(e) => setFilters({ ...filters, status: e.target.value })}>
              <option value="">Todos</option>
              <option value="aprovada">Aprovadas</option>
              <option value="rejeitada">Rejeitadas</option>
            </select>
            <button className="btn secondary" onClick={loadHistorico}>Filtrar</button>
          </div>
        </div>
        <div className="grid" style={{ gap: 8, marginTop: 8 }}>
          {hist.map((h) => (
            <div key={h.id} className="card">
              <div className="flex between">
                <div>
                  <div className="section-title" style={{ fontSize: 16 }}>Avaliacao {h.id}</div>
                  <div className="muted small">Prof {h.professor_nome}</div>
                </div>
                <span className="badge">{h.status}</span>
              </div>
              <div className="muted small">{new Date(h.created_at).toLocaleString()}</div>
              <div className="muted" style={{ marginTop: 6 }}>{h.comment || "Sem comentario"}</div>
            </div>
          ))}
          {hist.length === 0 && <div className="muted">Sem registros.</div>}
        </div>
      </div>
    </div>
  );
}

function HomePage() {
  return (
    <>
      <Hero />
      <div className="page">
        <ProfessoresSection />
        <TopSection />
      </div>
    </>
  );
}

function ProfessorPage() {
  const { id } = useParams();
  const { token, user } = useAuth();
  const [prof, setProf] = useState(null);
  const [avals, setAvals] = useState([]);
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const [perPage, setPerPage] = useState(10);
  const [msg, setMsg] = useState("");
  const [form, setForm] = useState({ nota: 5, comentario: "" });
  const navigate = useNavigate();
  const [confirm, setConfirm] = useState(false);

  const loadProf = async () => {
    try {
      const data = await api.professor(id);
      setProf(data);
    } catch (err) {
      setMsg(err.message);
    }
  };

  const loadAvals = async (p = page) => {
    try {
      const data = await api.professorAvaliacoes(id, { page: p, perPage });
      setAvals(data.itens || []);
      setTotal(data.total || 0);
      setPage(data.page || p);
      setPerPage(data.perPage || perPage);
    } catch (err) {
      setMsg(err.message);
    }
  };

  useEffect(() => {
    loadProf();
    loadAvals(1);
  }, [id]);

  const distribution = useMemo(() => {
    const counts = { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 };
    avals.forEach((a) => {
      const n = Number(a.rating || a.nota);
      if (counts[n] != null) counts[n] += 1;
    });
    return counts;
  }, [avals]);

  const submitAval = async (e) => {
    e.preventDefault();
    if (!token) {
      navigate("/login");
      return;
    }
    try {
      await api.enviarAvaliacao(Number(id), { nota: Number(form.nota), comentario: form.comentario }, token);
      setMsg("");
      setConfirm(true);
      setForm({ nota: 5, comentario: "" });
    } catch (err) {
      setMsg(err.message);
    }
  };

  return (
    <div className="page" style={{ marginTop: 24 }}>
      <div className="shell">
        {prof ? (
          <>
            <div className="flex between">
              <div>
                <h2 className="section-title" style={{ margin: 0 }}>{prof.nome}</h2>
                <div className="muted">{prof.instituicao || ""}{prof.departamento ? " - " + prof.departamento : ""}</div>
              </div>
              <div className="text-end">
                <div className="badge">{Number(prof.media || 0).toFixed(1)}</div>
                <div className="muted small">{prof.avaliacoes || 0} avaliacoes</div>
              </div>
            </div>
            <div className="muted" style={{ marginTop: 8 }}>{prof.bio || "Sem bio."}</div>
          </>
        ) : (
          <div className="muted">Carregando...</div>
        )}

        <div className="card" style={{ marginTop: 16 }}>
          <div className="section-title" style={{ fontSize: 16, marginBottom: 6 }}>Distribuicao</div>
          <div className="grid" style={{ gridTemplateColumns: "repeat(auto-fit, minmax(120px, 1fr))", gap: 8 }}>
            {[5,4,3,2,1].map((n) => (
              <div key={n} className="card prof-card" style={{ padding: 10 }}>
                <div className="flex between">
                  <span>Nota {n}</span>
                  <span className="badge">{distribution[n] || 0}</span>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="card" style={{ marginTop: 16 }}>
          <div className="flex between" style={{ marginBottom: 8 }}>
            <div className="section-title" style={{ fontSize: 16 }}>Avaliacoes aprovadas</div>
            <div className="flex" style={{ gap: 8 }}>
              <button className="btn secondary" disabled={page <= 1} onClick={() => loadAvals(page - 1)}>Prev</button>
              <button className="btn secondary" disabled={(page * perPage) >= total} onClick={() => loadAvals(page + 1)}>Next</button>
            </div>
          </div>
          <div className="muted small">Pagina {page} — total {total}</div>
          <div className="grid" style={{ gap: 8, marginTop: 8 }}>
            {avals.map((a) => (
              <div key={a.id} className="card" style={{ padding: 10 }}>
                <div className="flex between">
                  <div className="badge">{a.rating}</div>
                  <div className="muted small">{new Date(a.created_at).toLocaleDateString()}</div>
                </div>
                <div className="muted" style={{ fontSize: 14, marginTop: 6 }}>{a.comment || "Sem comentario"}</div>
              </div>
            ))}
            {avals.length === 0 && <div className="muted">Nenhuma avaliacao aprovada ainda.</div>}
          </div>
        </div>

        <div className="card" style={{ marginTop: 16 }}>
          <div className="flex between">
            <div>
              <div className="muted">Avaliacao</div>
              <h4 style={{ margin: 0 }}>Avaliar professor</h4>
            </div>
            <button className="btn secondary" onClick={() => { if (!token) navigate("/login"); }}>Precisa de login</button>
          </div>
          <form className="grid" style={{ gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", gap: 10, marginTop: 8 }} onSubmit={submitAval}>
            <input className="input" type="number" min="1" max="5" value={form.nota} onChange={(e) => setForm({ ...form, nota: e.target.value })} />
            <input className="input" placeholder="Comentario" value={form.comentario} onChange={(e) => setForm({ ...form, comentario: e.target.value })} />
            <button className="btn primary" type="submit">Enviar</button>
          </form>
          {msg && <div className="muted" style={{ marginTop: 6 }}>{msg}</div>}
        </div>
      </div>
      {confirm && (
        <div className="modal-overlay" onClick={() => setConfirm(false)}>
          <div className="modal-card" onClick={(e) => e.stopPropagation()}>
            <h4>Obrigado pela avaliacao</h4>
            <p className="muted">Sua avaliacao foi enviada e esta pendente de moderacao.</p>
            <div className="flex" style={{ marginTop: 8 }}>
              <button className="btn primary" onClick={() => setConfirm(false)}>Fechar</button>
              <Link className="btn secondary" to="/minhas-avaliacoes" onClick={() => setConfirm(false)}>Ver minhas avaliacoes</Link>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function MinhasAvaliacoesPage() {
  const { token } = useAuth();
  const [itens, setItens] = useState([]);
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const [perPage, setPerPage] = useState(10);
  const [msg, setMsg] = useState("");
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState({ nota: 5, comentario: "" });
  const navigate = useNavigate();

  const load = async (p = page) => {
    if (!token) { navigate("/login"); return; }
    try {
      const data = await api.minhasAvaliacoes(token, { page: p, perPage });
      setItens(data.itens || []);
      setTotal(data.total || 0);
      setPage(data.page || p);
      setPerPage(data.perPage || perPage);
    } catch (err) {
      setMsg(err.message);
    }
  };

  useEffect(() => { load(1); }, []);

  const startEdit = (item) => {
    setEditing(item.id);
    setForm({ nota: item.rating, comentario: item.comment || "" });
  };

  const saveEdit = async (id) => {
    try {
      await api.atualizarAvaliacao(id, { nota: Number(form.nota), comentario: form.comentario }, token);
      setMsg("Avaliacao atualizada e reenviada para moderacao");
      setEditing(null);
      setForm({ nota: 5, comentario: "" });
      load(page);
    } catch (err) {
      setMsg(err.message);
    }
  };

  const removeEval = async (id) => {
    try {
      await api.removerAvaliacao(id, token);
      setMsg("Avaliacao removida");
      load(page);
    } catch (err) {
      setMsg(err.message);
    }
  };

  return (
    <div className="page" style={{ marginTop: 24 }}>
      <div className="shell">
        <div className="flex between">
          <h3>Minhas avaliacoes</h3>
          <div className="flex" style={{ gap: 8 }}>
            <button className="btn secondary" disabled={page <= 1} onClick={() => load(page - 1)}>Prev</button>
            <button className="btn secondary" disabled={(page * perPage) >= total} onClick={() => load(page + 1)}>Next</button>
          </div>
        </div>
        <div className="muted small">Pagina {page} — total {total}</div>
        {msg && <div className="muted" style={{ marginTop: 6 }}>{msg}</div>}

        <div className="grid" style={{ gap: 10, marginTop: 10 }}>
          {itens.map((a) => (
            <div key={a.id} className="card">
              <div className="flex between">
                <div>
                  <div className="section-title" style={{ fontSize: 16 }}>Prof {a.professor_nome}</div>
                  <div className="muted small">{new Date(a.created_at).toLocaleDateString()}</div>
                </div>
                <span className="badge">{a.rating}</span>
              </div>
              {editing === a.id ? (
                <>
                  <div className="grid" style={{ gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))", gap: 8, marginTop: 8 }}>
                    <input className="input" type="number" min="1" max="5" value={form.nota} onChange={(e) => setForm({ ...form, nota: e.target.value })} />
                    <input className="input" value={form.comentario} onChange={(e) => setForm({ ...form, comentario: e.target.value })} />
                  </div>
                  <div className="flex" style={{ marginTop: 8 }}>
                    <button className="btn primary" onClick={() => saveEdit(a.id)}>Salvar</button>
                    <button className="btn secondary" onClick={() => setEditing(null)}>Cancelar</button>
                  </div>
                </>
              ) : (
                <>
                  <div className="muted" style={{ marginTop: 6 }}>{a.comment || "Sem comentario"}</div>
                  <div className="muted small" style={{ marginTop: 4 }}>Status: {a.status}</div>
                  <div className="flex" style={{ marginTop: 8 }}>
                    <button className="btn secondary" onClick={() => startEdit(a)}>Editar</button>
                    <button className="btn danger" onClick={() => removeEval(a.id)}>Remover</button>
                  </div>
                </>
              )}
            </div>
          ))}
          {itens.length === 0 && <div className="muted">Nenhuma avaliacao encontrada.</div>}
        </div>
      </div>
    </div>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Navbar />
        <Routes>
          <Route path="/" element={<HomePage />} />
          <Route path="/login" element={<LoginPage />} />
          <Route path="/register" element={<RegisterPage />} />
          <Route path="/professores/:id" element={<ProfessorPage />} />
          <Route path="/minhas-avaliacoes" element={<MinhasAvaliacoesPage />} />
          <Route path="/instituicoes" element={<InstituicoesPage />} />
          <Route path="/admin" element={<AdminPage />} />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
}
