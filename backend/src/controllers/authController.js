import jwt from "jsonwebtoken";
import bcrypt from "bcryptjs";
import Usuario from "../models/UsuarioModel.js";

/* =====================================================
   🔐 FUNÇÕES PARA GERAR TOKENS
===================================================== */

function gerarAccessToken(usuario) {
  return jwt.sign(
    {
      id: usuario._id,
      email: usuario.email,
      role: usuario.role, // 🔥 IMPORTANTE PARA ROTAS ADMIN
    },
    process.env.JWT_ACCESS_SECRET,
    { expiresIn: process.env.ACCESS_TOKEN_EXPIRES || "15m" }
  );
}

function gerarRefreshToken(usuario) {
  return jwt.sign(
    {
      id: usuario._id,
      role: usuario.role, // 🔥 AGORA TEM O ROLE!
    },
    process.env.JWT_REFRESH_SECRET,
    { expiresIn: process.env.REFRESH_TOKEN_EXPIRES || "7d" }
  );
}

/* =====================================================
   🟦 REGISTRO (ADMIN cria usuário)
===================================================== */

export const register = async (req, res) => {
  try {
    const { nome, email, password, role } = req.body;

    const existente = await Usuario.findOne({ email });
    if (existente)
      return res.status(409).json({ error: "Email já cadastrado" });

    const passwordHash = await bcrypt.hash(password, 10);

    const user = await Usuario.create({
      nome,
      email,
      passwordHash,
      role: role || "user",
    });

    const accessToken = gerarAccessToken(user);
    const refreshToken = gerarRefreshToken(user);

    res.cookie("jid", refreshToken, {
      httpOnly: true,
      secure: false, // EM PRODUÇÃO USE true
      sameSite: "lax",
      path: "/api/v1/auth",
    });

    return res.status(201).json({
      accessToken,
      user: {
        id: user._id,
        nome: user.nome,
        email: user.email,
        role: user.role,
      },
    });
  } catch (err) {
    console.error("ERRO REGISTER:", err);
    res.status(500).json({ error: "Erro ao registrar" });
  }
};

/* =====================================================
   🟩 LOGIN
===================================================== */

export const login = async (req, res) => {
  try {
    const { email, password } = req.body;

    const user = await Usuario.findOne({ email });
    if (!user) return res.status(401).json({ error: "Credenciais inválidas" });

    const senhaOK = await bcrypt.compare(password, user.passwordHash);
    if (!senhaOK)
      return res.status(401).json({ error: "Credenciais inválidas" });

    const accessToken = gerarAccessToken(user);
    const refreshToken = gerarRefreshToken(user);

    res.cookie("jid", refreshToken, {
      httpOnly: true,
      secure: false,
      sameSite: "lax",
      path: "/api/v1/auth",
    });

    return res.json({
      accessToken,
      user: {
        id: user._id,
        nome: user.nome,
        email: user.email,
        role: user.role,
      },
    });
  } catch (err) {
    console.error("ERRO LOGIN:", err);
    res.status(500).json({ error: "Erro no login" });
  }
};

/* =====================================================
   🔄 REFRESH TOKEN
===================================================== */

export const refresh = async (req, res) => {
  try {
    const token = req.cookies.jid;
    if (!token) return res.status(401).json({ error: "Sem refresh token" });

    const payload = jwt.verify(token, process.env.JWT_REFRESH_SECRET);

    const user = await Usuario.findById(payload.id);
    if (!user) return res.status(401).json({ error: "Usuário não encontrado" });

    // 🔥 AGORA O novo Access Token terá o role corretamente!
    const newAccessToken = gerarAccessToken(user);
    const newRefreshToken = gerarRefreshToken(user);

    res.cookie("jid", newRefreshToken, {
      httpOnly: true,
      secure: false,
      sameSite: "lax",
      path: "/api/v1/auth",
    });

    return res.json({
      accessToken: newAccessToken,
      user: {
        id: user._id,
        nome: user.nome,
        email: user.email,
        role: user.role,
      },
    });
  } catch (err) {
    console.error("ERRO REFRESH:", err);
    res.status(401).json({ error: "Refresh inválido" });
  }
};

/* =====================================================
   🚪 LOGOUT
===================================================== */

export const logout = (_req, res) => {
  res.clearCookie("jid", { path: "/api/v1/auth" });
  return res.json({ ok: true });
};

/* =====================================================
   🧩 ME (usuário logado)
===================================================== */

export const me = async (req, res) => {
  try {
    const user = await Usuario.findById(req.user.id).select("-passwordHash");
    if (!user) return res.sendStatus(401);

    res.json(user);
  } catch (err) {
    console.error("ERRO ME:", err);
    res.sendStatus(401);
  }
};
