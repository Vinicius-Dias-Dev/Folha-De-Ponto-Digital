import api from "./api";

export const listarFichasPorFuncionario = async (id) => {
  const res = await api.get(`/fichas/funcionario/${id}`);
  return res.data;
};

export const buscarFichaPorId = async (id) => {
  const res = await api.get(`/fichas/${id}`);
  return res.data;
};

export const atualizarFicha = async (id, dados) => {
  const res = await api.put(`/fichas/${id}`, dados);
  return res.data;
};

export async function criarFicha(data) {
  const res = await api.post("/fichas", data);
  return res.data;
}

// 🔥 NOVO: excluir ficha
export const deletarFicha = async (id) => {
  const res = await api.delete(`/fichas/${id}`);
  return res.data;
};
