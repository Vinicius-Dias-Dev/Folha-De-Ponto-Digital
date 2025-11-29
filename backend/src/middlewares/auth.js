import jwt from "jsonwebtoken";

export function auth(requiredRole = null) {
  return (req, res, next) => {
    const authHeader = req.headers.authorization || "";
    const token = authHeader.startsWith("Bearer ") ? authHeader.slice(7) : null;
    if (!token) return res.status(401).json({ error: "Token ausente" });

    try {
      const payload = jwt.verify(token, process.env.JWT_ACCESS_SECRET);
      if (requiredRole && payload.role !== requiredRole) {
        return res.status(403).json({ error: "Acesso negado" });
      }
      req.user = payload;
      next();
    } catch {
      return res.status(401).json({ error: "Token inválido ou expirado" });
    }
  };
}
