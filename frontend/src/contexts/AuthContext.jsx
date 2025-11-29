/* eslint-disable react-refresh/only-export-components */
import { createContext, useContext, useState, useEffect } from "react";
import { login as doLogin, logoutRequest } from "../services/authService";
import api from "../services/api";
import { setAccessToken, getAccessToken, removeAccessToken } from "../services/tokenService";

const AuthCtx = createContext();

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(null);        // 🔥 AGORA TEMOS O TOKEN NO CONTEXTO
  const [authReady, setAuthReady] = useState(false);

  useEffect(() => {
    async function verifySession() {
      const storedToken = getAccessToken(); // 🔥 @folha:token

      if (!storedToken) {
        setUser(false);
        setAuthReady(true);
        return;
      }

      setToken(storedToken); // 🔥 CARREGA TOKEN NA MEMÓRIA

      try {
        const { data } = await api.get("/auth/me");
        setUser(data);
      } catch {
        setUser(false);
        removeAccessToken();
      } finally {
        setAuthReady(true);
      }
    }

    verifySession();
  }, []);

  // 🔥 LOGIN — salva token no estado E no localStorage
  async function login(email, password) {
    const { accessToken, user } = await doLogin(email, password);

    setAccessToken(accessToken); // salva no localStorage
    setToken(accessToken);       // salva no contexto
    setUser(user);

    return user;
  }

  // 🔥 LOGOUT — remove token corretamente
  async function logout() {
    await logoutRequest();
    removeAccessToken();
    setToken(null);
    setUser(false);
  }

  return (
    <AuthCtx.Provider value={{ user, token, login, logout, authReady }}>
      {children}
    </AuthCtx.Provider>
  );
}

export function useAuth() {
  return useContext(AuthCtx);
}
