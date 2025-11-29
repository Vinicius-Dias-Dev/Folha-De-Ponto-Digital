import mongoose from "mongoose";
import "dotenv/config";
import Ficha from "../src/models/FichaModel.js";
import Empregado from "../src/models/EmpregadoModel.js";

async function limparFichasOrfas() {
  try {
    await mongoose.connect(process.env.MONGO_URI);

    // Pega todos os IDs de empregados válidos
    const empregados = await Empregado.find({}, "_id");
    const idsValidos = empregados.map((e) => e._id.toString());

    // Busca fichas cujo funcionário não existe mais
    const fichasOrfas = await Ficha.find();
    const orfas = fichasOrfas.filter(
      (f) => !f.funcionario || !idsValidos.includes(f.funcionario.toString())
    );

    if (orfas.length === 0) {
      console.log("✅ Nenhuma ficha órfã encontrada!");
      process.exit(0);
    }

    const idsParaExcluir = orfas.map((f) => f._id);
    const result = await Ficha.deleteMany({ _id: { $in: idsParaExcluir } });

    console.log(`🧹 Fichas órfãs removidas: ${result.deletedCount}`);
    process.exit(0);
  } catch (err) {
    console.error("Erro ao limpar fichas:", err);
    process.exit(1);
  }
}

limparFichasOrfas();
