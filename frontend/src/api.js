const API_URL = import.meta.env.VITE_API_URL || "http://localhost:3000";

async function request(path, { method = "GET", body, token } = {}) {
  const headers = { "Content-Type": "application/json" };
  if (token) headers.Authorization = `Bearer ${token}`;
  const res = await fetch(`${API_URL}${path}`, {
    method,
    headers,
    body: body ? JSON.stringify(body) : undefined,
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(data.message || "Erro");
  return data;
}

export const api = {
  login: (email, password) => request("/auth/login", { method: "POST", body: { email, password } }),
  register: (payload) => request("/auth/register", { method: "POST", body: payload }),
  me: (token) => request("/auth/me", { token }),
  professores: (params = {}) => {
    const qs = new URLSearchParams(params).toString();
    return request(`/professores${qs ? "?" + qs : ""}`);
  },
  professor: (id) => request(`/professores/${id}`),
  professorAvaliacoes: (id, params = {}) => {
    const qs = new URLSearchParams(params).toString();
    return request(`/professores/${id}/avaliacoes${qs ? "?" + qs : ""}`);
  },
  topProfessores: () => request("/professores/top"),
  enviarAvaliacao: (professorId, payload, token) =>
    request(`/professores/${professorId}/avaliacoes`, { method: "POST", body: payload, token }),
  minhasAvaliacoes: (token, params = {}) => {
    const qs = new URLSearchParams(params).toString();
    return request(`/me/avaliacoes${qs ? "?" + qs : ""}`, { token });
  },
  atualizarAvaliacao: (id, payload, token) =>
    request(`/avaliacoes/${id}`, { method: "PATCH", body: payload, token }),
  removerAvaliacao: (id, token) =>
    request(`/avaliacoes/${id}`, { method: "DELETE", token }),
  pendentes: (token) => request("/admin/avaliacoes/pendentes", { token }),
  aprovar: (id, token) => request(`/admin/avaliacoes/${id}/aprovar`, { method: "POST", token }),
  rejeitar: (id, motivo, token) =>
    request(`/admin/avaliacoes/${id}/rejeitar`, { method: "POST", body: { motivo }, token }),
  criarInstituicao: (nome, token) => request("/admin/instituicoes", { method: "POST", body: { nome }, token }),
  criarDepartamento: (institutionId, nome, token) =>
    request("/admin/departamentos", { method: "POST", body: { institutionId, nome }, token }),
  salvarProfessor: (payload, token, id) => {
    if (id) return request(`/admin/professores/${id}`, { method: "PATCH", body: payload, token });
    return request("/admin/professores", { method: "POST", body: payload, token });
  },
  removerProfessor: (id, token) => request(`/admin/professores/${id}`, { method: "DELETE", token }),
  instituicoes: () => request("/instituicoes"),
  departamentos: (institutionId) => request(`/instituicoes/${institutionId}/departamentos`),
  adminInstituicoes: (token) => request("/admin/instituicoes", { token }),
  adminDepartamentos: (token, institutionId) => {
    const qs = institutionId ? `?institutionId=${institutionId}` : "";
    return request(`/admin/departamentos${qs}`, { token });
  },
  adminProfessores: (token, params = {}) => {
    const qs = new URLSearchParams(params).toString();
    return request(`/admin/professores${qs ? "?" + qs : ""}`, { token });
  },
  historicoModeracao: (token, status) => {
    const qs = status ? `?status=${status}` : "";
    return request(`/admin/avaliacoes/historico${qs}`, { token });
  },
  adminStats: (token) => request("/admin/stats", { token }),
};
