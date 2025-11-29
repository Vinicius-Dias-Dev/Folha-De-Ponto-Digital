import express from "express";
import {
  criarEmpregado,
  listarEmpregados,
  deletarEmpregado,
  atualizarEmpregado,
  buscarEmpregadoPorId,
  atualizarAssinaturaGestor       //  <-- 🔥 IMPORTAMOS AQUI
} from "../controllers/empregadoController.js";
import { auth } from "../middlewares/auth.js";

const router = express.Router();

// ✅ Apenas ADMIN pode mexer com empregados
router.use(auth("admin"));

// Criar novo empregado
router.post("/", criarEmpregado);

// Listar todos os empregados
router.get("/", listarEmpregados);

// Buscar um empregado específico
router.get("/:id", buscarEmpregadoPorId);

// Atualizar empregado existente
router.put("/:id", atualizarEmpregado);

// 🔥 NOVA ROTA — Atualizar assinatura padrão do gestor
router.put("/:id/assinatura-gestor", atualizarAssinaturaGestor);

// Deletar empregado
router.delete("/:id", deletarEmpregado);

export default router;
