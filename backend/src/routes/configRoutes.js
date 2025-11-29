import express from "express";
import {
  gerarLinkAssinaturaGestor,
  salvarAssinaturaGestor,
  carregarAssinaturaGestor,
  salvarAssinaturaManual
} from "../controllers/configController.js";
import { auth } from "../middlewares/auth.js";

const router = express.Router();

// 🌎 ROTAS PÚBLICAS (sem auth)
router.post("/assinatura-gestor/salvar", salvarAssinaturaGestor);

// 🔐 ROTAS QUE REQUEREM LOGIN
router.use(auth());

// gerar link
router.post("/assinatura-gestor/link", gerarLinkAssinaturaGestor);

// carregar assinatura salva
router.get("/assinatura-gestor", carregarAssinaturaGestor);

// salvar assinatura manual
router.put("/assinatura-gestor", salvarAssinaturaManual);

export default router;
