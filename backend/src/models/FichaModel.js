import mongoose from "mongoose";

const DiaSchema = new mongoose.Schema(
  {
    data: Number,
    entrada: String,
    saidaAlmoco: String,
    entradaAlmoco: String,
    saida: String,
    extraEntrada: String,
    extraSaida: String,

    // ✅ CAMPOS PARA FALTAS / PRESENÇA
    tipo: {
      type: String,
      enum: ["presente", "faltou", "abonada", "atestado", ""],
      default: "presente",
    },

    obs: {
      type: String,
      default: "",
    },
  },
  { _id: false }
);

const ResumoSchema = new mongoose.Schema(
  {
    diasHorasNormais: String,
    horasExtras: String,
    faltas: [
      {
        dia: Number,
        tipo: String,
        obs: String,
      },
    ],
    baseCalculo: String,
    inss: String,
    salarioFamilia: String,
    liquido: String,
  },
  { _id: false }
);

const HeaderSchema = new mongoose.Schema(
  {
    empregadorNome: String,
    cnpjOuCei: String,
    endereco: String,
    empregadoNome: String,
    ctpsNumeroESerie: String,
    dataAdmissao: String,
    funcao: String,
    horarioSegASex: String,
    horarioSabado: String,
    descansoSemanal: String,
    mes: Number,
    ano: Number,
  },
  { _id: false }
);

const FichaSchema = new mongoose.Schema({
  funcionario: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Empregado",
    required: true,
  },

  mesReferencia: Number,
  anoReferencia: Number,
  header: HeaderSchema,

  diasDoMes: [DiaSchema],

  resumoGeral: ResumoSchema,

  assinatura: {
    type: String,
    default: "",
  },

  assinaturaFuncionario: {
    type: String,
    default: "",
  },

  assinaturaToken: {
    type: String,
    default: null,
  },

  assinaturaTokenExpiraEm: {
    type: Date,
    default: null,
  },
});

const Ficha = mongoose.model("Ficha", FichaSchema);
export default Ficha;
