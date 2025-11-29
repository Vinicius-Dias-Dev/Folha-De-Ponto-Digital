import express from "express";
import {
  listarFichas,
  criarFicha,
  atualizarFicha,
  deletarFicha,
  buscarFichaPorId,
  listarFichasPorFuncionario,
  atualizarHeader,
  gerarLinkAssinatura,
  buscarFichaPorToken,
  assinarFichaPorToken,
} from "../controllers/fichaController.js";
import { auth } from "../middlewares/auth.js";

const router = express.Router();

/* ---------------------------------------------
   🔓 ROTAS PÚBLICAS – usadas pelo funcionário via LINK
------------------------------------------------ */
router.get("/por-token/:token", buscarFichaPorToken);
router.post("/assinar/:token", assinarFichaPorToken);

/* ---------------------------------------------
   🔐 ROTAS PROTEGIDAS – apenas ADMIN
------------------------------------------------ */
router.use(auth("admin"));

// rotas fixas
router.get("/", listarFichas);
router.post("/", criarFicha);
router.get("/funcionario/:id", listarFichasPorFuncionario);
router.put("/:id/header", atualizarHeader);
router.post("/:id/gerar-link-assinatura", gerarLinkAssinatura);

// rotas genéricas
router.put("/:id", atualizarFicha);
router.delete("/:id", deletarFicha);
router.get("/:id", buscarFichaPorId);

export default router;
