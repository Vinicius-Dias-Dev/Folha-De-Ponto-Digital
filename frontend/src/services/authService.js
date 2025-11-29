import axios from "axios";
import api from "./api";

const baseURL = import.meta.env.VITE_API_BASE_URL;

// ==================================================
// 🔐 LOGIN NORMAL (usa api com interceptors)
// ==================================================
export async function login(email, password) {
  try {
    const { data } = await api.post("/auth/login", { email, password });
    return data;
  } catch (error) {
    if (error.response?.status === 401) {
      throw new Error("E-mail ou senha incorretos");
    }
    throw error;
  }
}

// ==================================================
// 🔄 REFRESH TOKEN (NÃO usa 'api')
// ==================================================
export async function refreshToken() {
  const baseURL = import.meta.env.VITE_API_BASE_URL;

  const { data } = await axios.post(
    `${baseURL}/auth/refresh`,
    {},
    {
      withCredentials: true,
      headers: { "Content-Type": "application/json" },
    }
  );

  return data.accessToken;
}


// ==================================================
// 🚪 LOGOUT
// ==================================================
export async function logoutRequest() {
  return api.post("/auth/logout");
}
