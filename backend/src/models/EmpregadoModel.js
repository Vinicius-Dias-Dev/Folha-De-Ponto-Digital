import mongoose from "mongoose";

function normalizarCPF(cpf = "") {
  return cpf.replace(/\D/g, ""); // remove pontos e traço
}

const EmpregadoSchema = new mongoose.Schema(
  {
    // 🔹 Identificação básica
    nome: { type: String, required: true, trim: true },
    cpf: {
      type: String,
      default: "",
      trim: true,
      index: true,
      unique: true, // 🔒 impede duplicidade
    },
    funcao: { type: String, default: "" },
    ctps: { type: String, default: "" },

    // 🔹 Foto do funcionário
    foto: { type: String, default: "" },

    // 🔹 Dados de admissão e horários
    dataAdmissao: { type: String, default: "" },
    horarioSegASex: { type: String, default: "" },
    horarioSabado: { type: String, default: "" },
    descansoSemanal: { type: String, default: "" },

    // 🔹 Dados do empregador
    empregadorNome: { type: String, default: "" },
    cnpjOuCei: { type: String, default: "" },
    endereco: { type: String, default: "" },

    // 🔹 Referência de ficha (opcional)
    mesReferencia: { type: Number },
    anoReferencia: { type: Number },

    // 🔥 NOVO CAMPO — Assinatura do gestor (base64 PNG)
    assinaturaGestor: {
      type: String,
      default: "",
    },
  },
  { timestamps: true }
);

// 🔧 Middleware para normalizar CPF antes de salvar
EmpregadoSchema.pre("save", function (next) {
  if (this.isModified("cpf")) {
    this.cpf = normalizarCPF(this.cpf);
  }
  next();
});

// 🔧 Middleware para garantir que o nome não seja duplicado (case insensitive)
EmpregadoSchema.pre("save", async function (next) {
  if (!this.isModified("nome")) return next();

  const nomeRegex = new RegExp(`^${this.nome}$`, "i");
  const existente = await mongoose.models.Empregado.findOne({ nome: nomeRegex });

  if (existente && existente._id.toString() !== this._id.toString()) {
    return next(new Error("Funcionário já existente com este nome."));
  }

  next();
});

export default mongoose.model("Empregado", EmpregadoSchema);
