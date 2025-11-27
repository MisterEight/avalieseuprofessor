import { useEffect, useState } from "react";
import { api } from "../api.js";

export default function InstituicoesPage() {
  const [insts, setInsts] = useState([]);
  const [deps, setDeps] = useState([]);
  const [selected, setSelected] = useState(null);
  const [msg, setMsg] = useState("");

  useEffect(() => {
    api.instituicoes().then(setInsts).catch((err) => setMsg(err.message));
  }, []);

  const loadDeps = async (id) => {
    setSelected(id);
    setDeps([]);
    if (!id) return;
    try {
      const data = await api.departamentos(id);
      setDeps(data);
    } catch (err) {
      setMsg(err.message);
    }
  };

  return (
    <div className="page" style={{ marginTop: 24 }}>
      <div className="shell">
        <h3>Instituicoes e departamentos</h3>
        {msg && <div className="muted">{msg}</div>}
        <div className="grid" style={{ gridTemplateColumns: "1fr 1fr", gap: 12 }}>
          <div className="card">
            <div className="section-title" style={{ fontSize: 16 }}>Instituicoes</div>
            <div className="grid" style={{ gap: 8, marginTop: 8 }}>
              {insts.map((i) => (
                <button key={i.id} className={`btn ${selected == i.id ? "primary" : "secondary"}`} onClick={() => loadDeps(i.id)}>
                  {i.nome}
                </button>
              ))}
              {insts.length === 0 && <div className="muted">Nenhuma instituicao</div>}
            </div>
          </div>
          <div className="card">
            <div className="section-title" style={{ fontSize: 16 }}>Departamentos</div>
            <div className="grid" style={{ gap: 8, marginTop: 8 }}>
              {deps.map((d) => (
                <div key={d.id} className="card" style={{ padding: 10 }}>
                  {d.nome}
                </div>
              ))}
              {deps.length === 0 && <div className="muted">Selecione uma instituicao</div>}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
