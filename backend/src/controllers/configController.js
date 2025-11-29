import crypto from "crypto";
import Empregado from "../models/EmpregadoModel.js";

let codigoTemp = null;

// GERAR LINK
export const gerarLinkAssinaturaGestor = (req, res) => {
  const codigo = crypto.randomBytes(16).toString("hex");
  codigoTemp = codigo;

  const urlAssinatura = `${process.env.FRONTEND_BASE_URL}/assinar-gestor/${codigo}`;

  return res.json({ codigo, urlAssinatura });
};

// SALVAR ASSINATURA VIA LINK (rota pública)
export const salvarAssinaturaGestor = async (req, res) => {
  const { codigo, assinaturaBase64 } = req.body;

  if (!codigo || codigo !== codigoTemp) {
    return res.status(400).json({ error: "Código inválido ou expirado" });
  }

  await Empregado.updateMany({}, { assinaturaGestor: assinaturaBase64 });
  codigoTemp = null;

  return res.json({ ok: true });
};

// CARREGAR ASSINATURA ATUAL
export const carregarAssinaturaGestor = async (req, res) => {
  const emp = await Empregado.findOne({ assinaturaGestor: { $exists: true } });

  return res.json({
    assinaturaGestor: emp?.assinaturaGestor || null
  });
};

// SALVAR MANUAL (rota protegida)
export const salvarAssinaturaManual = async (req, res) => {
  const { assinaturaBase64 } = req.body;

  if (!assinaturaBase64) {
    return res.status(400).json({ error: "Assinatura não enviada" });
  }

  await Empregado.updateMany({}, { assinaturaGestor: assinaturaBase64 });

  res.json({ ok: true });
};
