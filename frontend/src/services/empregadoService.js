import api from "./api";

export const listarEmpregados = async () => {
  const res = await api.get("/empregados");
  return res.data;
};

export const criarEmpregado = async (dados) => {
  const res = await api.post("/empregados", dados);
  return res.data;
};

export const deletarEmpregado = async (id) => {
  const { data } = await api.delete(`/empregados/${id}`);
  return data;
};

export async function buscarEmpregadoPorId(id) {
  const { data } = await api.get(`/empregados/${id}`);
  return data;
}

export const atualizarEmpregado = async (id, dados) => {
  const { data } = await api.put(`/empregados/${id}`, dados);
  return data;
};