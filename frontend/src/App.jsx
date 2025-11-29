import { Routes, Route, Navigate } from "react-router-dom";
import GuardedRoute from "./components/GuardedRoute";

import Login from "./pages/Login";
import Sistema from "./Sistema";

// 🔓 Páginas públicas
import AssinaturaPublica from "./pages/AssinaturaPublica";       // funcionário
import AssinaturaGestorPublica from "./pages/AssinarGestor";  // gestor (se quiser separar)

export default function App() {
  return (
    <Routes>

      {/* 🔓 Assinatura pública (FUNCIONÁRIO) */}
      <Route path="/assinar/:token" element={<AssinaturaPublica />} />

      {/* 🔓 Assinatura pública (GESTOR) */}
      <Route path="/assinar-gestor/:token" element={<AssinaturaGestorPublica />} />

      {/* Login */}
      <Route path="/" element={<Navigate to="/login" />} />
      <Route path="/login" element={<Login />} />

      {/* Sistema protegido */}
      <Route
        path="/sistema/*"
        element={
          <GuardedRoute>
            <Sistema />
          </GuardedRoute>
        }
      />

      {/* Rota desconhecida */}
      <Route path="*" element={<Navigate to="/login" />} />
    </Routes>
  );
}
