import express from "express";
import cors from "cors";
import mongoose from "mongoose";
import dotenv from "dotenv";
import cookieParser from "cookie-parser";
import helmet from "helmet";
import rateLimit from "express-rate-limit";

import routeEmpregados from "./src/routes/routeEmpregados.js";
import routeFichas from "./src/routes/routeFichas.js";
import authRoutes from "./src/routes/authRoutes.js";
import configRoutes from "./src/routes/configRoutes.js";

dotenv.config();

const app = express();

// Segurança
app.use(helmet());
app.use(express.json({ limit: "1mb" }));
app.use(cookieParser());

// CORS
const allowedOrigins = [
  "http://localhost:5173",
  "https://folha-pontodigital.netlify.app"
];

app.use(
  cors({
    origin: (origin, callback) => {
      if (!origin || allowedOrigins.includes(origin)) {
        callback(null, true);
      } else {
        console.warn("❌ Bloqueado por CORS:", origin);
        callback(new Error("Not allowed by CORS"));
      }
    },
    credentials: true
  })
);

// Rate limiter
app.use("/api/v1/auth", rateLimit({ windowMs: 15 * 60 * 1000, max: 100 }));

// Rotas
app.use("/api/v1/auth", authRoutes);
app.use("/api/v1/empregados", routeEmpregados);
app.use("/api/v1/fichas", routeFichas);
app.use("/api/v1/config", configRoutes);


// Start
const PORT = process.env.PORT || 3001;
const MONGO_URI = process.env.MONGO_URI;

mongoose
  .connect(MONGO_URI)
  .then(() => {
    console.log("✅ MongoDB conectado");
    app.listen(PORT, () =>
      console.log(`🚀 Server rodando porta ${PORT}`)
    );
  })
  .catch((err) => console.error("Erro ao conectar Mongo:", err));
