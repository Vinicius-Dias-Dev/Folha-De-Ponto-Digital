import express from "express";
import { login, register, refresh, logout, me } from "../controllers/authController.js";
import { auth } from "../middlewares/auth.js";

const router = express.Router();

router.post("/login", login);
router.post("/register", register);
router.post("/refresh", refresh);
router.post("/logout", logout);

// ✅ Aqui a rota que o frontend está chamando
router.get("/me", auth(), me);

export default router;
