import mongoose from "mongoose";
import Usuario from "../src/models/UsuarioModel.js";
import "dotenv/config.js";

async function setAdmin() {
  try {
    await mongoose.connect(process.env.MONGO_URI);

    const email = "admin@folha.com";
    const role = "admin";

    const user = await Usuario.findOneAndUpdate(
      { email },
      { role },
      { new: true }
    );

    if (!user) {
      console.log("Usuário não encontrado!");
    } else {
      console.log(`✅ Papel atualizado: ${user.email} → ${user.role}`);
    }

    mongoose.connection.close();
  } catch (err) {
    console.error("Erro ao atualizar admin:", err);
    mongoose.connection.close();
  }
}

setAdmin();
