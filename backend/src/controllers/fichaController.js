import Ficha from "../models/FichaModel.js";
import Empregado from "../models/EmpregadoModel.js";

/** 🔑 Gera token sem depender de crypto */
function gerarTokenAssinatura(idFicha) {
  const parteRandom = Math.random().toString(36).slice(2, 10);
  const timestamp = Date.now().toString(36);
  return `${idFicha}-${timestamp}-${parteRandom}`;
}

/* =====================================================
   📌 LISTAR TODAS AS FICHAS
===================================================== */
export const listarFichas = async (req, res) => {
  try {
    const fichas = await Ficha.find().populate("funcionario").lean();
    res.json(fichas);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

/* =====================================================
   📌 CRIAR FICHA
===================================================== */
export const criarFicha = async (req, res) => {
  try {
    const ficha = new Ficha(req.body);
    await ficha.save();
    res.status(201).json(ficha);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
};

/* =====================================================
   📌 ATUALIZAR FICHA COMPLETA
===================================================== */
export const atualizarFicha = async (req, res) => {
  try {
    const { id } = req.params;
    const dados = req.body;

    const updateData = {};

    if (Array.isArray(dados.diasDoMes)) {
      updateData.diasDoMes = dados.diasDoMes;
    }

    if (dados.resumoGeral) {
      updateData.resumoGeral = {
        diasHorasNormais: dados.resumoGeral.diasHorasNormais || "",
        horasExtras: dados.resumoGeral.horasExtras || "",
        faltas: Array.isArray(dados.resumoGeral.faltas)
          ? dados.resumoGeral.faltas
          : [],
        baseCalculo: dados.resumoGeral.baseCalculo || "",
        inss: dados.resumoGeral.inss || "",
        salarioFamilia: dados.resumoGeral.salarioFamilia || "",
        liquido: dados.resumoGeral.liquido || "",
      };
    }

    if (typeof dados.assinatura === "string") {
      updateData.assinatura = dados.assinatura;
    }

    if (typeof dados.assinaturaFuncionario === "string") {
      updateData.assinaturaFuncionario = dados.assinaturaFuncionario;
    }

    const ficha = await Ficha.findByIdAndUpdate(
      id,
      { $set: updateData },
      { new: true, runValidators: false }
    );

    if (!ficha) {
      return res.status(404).json({ message: "Ficha não encontrada" });
    }

    res.json(ficha);
  } catch (error) {
    console.error("Erro ao atualizar ficha:", error);
    res.status(500).json({
      message: "Erro ao atualizar ficha",
      error: error.message,
    });
  }
};

/* =====================================================
   📌 DELETAR FICHA
===================================================== */
export const deletarFicha = async (req, res) => {
  try {
    const { id } = req.params;
    await Ficha.findByIdAndDelete(id);
    res.json({ message: "Ficha deletada com sucesso" });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

/* =====================================================
   📌 BUSCAR FICHA POR ID
===================================================== */
export const buscarFichaPorId = async (req, res) => {
  try {
    const { id } = req.params;
    const ficha = await Ficha.findById(id);

    if (!ficha) {
      return res.status(404).json({ error: "Ficha não encontrada" });
    }

    if (!ficha.funcionario) {
      return res
        .status(400)
        .json({ error: "Ficha sem vínculo de funcionário" });
    }

    res.json(ficha);
  } catch (err) {
    res.status(500).json({ error: "Erro interno ao buscar ficha" });
  }
};

/* =====================================================
   📌 LISTAR FICHAS POR FUNCIONÁRIO
===================================================== */
export const listarFichasPorFuncionario = async (req, res) => {
  try {
    const { id } = req.params;

    const funcionarioExiste = await Empregado.exists({ _id: id });
    if (!funcionarioExiste) {
      return res.json([]);
    }

    const fichas = await Ficha.find({ funcionario: id }).lean();
    res.json(fichas);
  } catch (err) {
    res.status(500).json({ error: "Erro ao listar fichas" });
  }
};

/* =====================================================
   📌 ATUALIZAR HEADER
===================================================== */
export const atualizarHeader = async (req, res) => {
  try {
    const { id } = req.params;
    const ficha = await Ficha.findByIdAndUpdate(
      id,
      { $set: { header: req.body } },
      { new: true }
    );

    if (!ficha) {
      return res.status(404).json({ error: "Ficha não encontrada" });
    }

    res.json({ message: "Cabeçalho atualizado", ficha });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

/* =====================================================
   🔥 ASSINATURA DIGITAL VIA LINK
===================================================== */

// Helper
const tokenExpirado = (ficha) => {
  if (!ficha.assinaturaTokenExpiraEm) return true;
  return ficha.assinaturaTokenExpiraEm <= new Date();
};

/* =====================================================
   📌 1) GERAR TOKEN + LINK DE ASSINATURA
===================================================== */
export const gerarLinkAssinatura = async (req, res) => {
  try {
    const { id } = req.params;

    const ficha = await Ficha.findById(id).populate("funcionario");
    if (!ficha) {
      return res.status(404).json({ error: "Ficha não encontrada" });
    }

    const token = gerarTokenAssinatura(id);
    const agora = new Date();
    const expiraEm = new Date(agora.getTime() + 5 * 60 * 1000);

    ficha.assinaturaToken = token;
    ficha.assinaturaTokenExpiraEm = expiraEm;
    await ficha.save();

    // 🔥 CORREÇÃO ABSOLUTA — SEM req.headers.origin
    const baseUrl =
      process.env.FRONTEND_BASE_URL || "http://localhost:5173";

    const urlAssinatura = `${baseUrl}/assinar/${token}`;

    return res.json({
      message: "Link de assinatura gerado com sucesso",
      token,
      expiraEm,
      urlAssinatura,
    });
  } catch (error) {
    console.error("Erro ao gerar link de assinatura:", error);
    res.status(500).json({
      error: "Erro ao gerar link de assinatura",
      details: error.message,
    });
  }
};

/* =====================================================
   📌 2) BUSCAR FICHA PELO TOKEN
===================================================== */
export const buscarFichaPorToken = async (req, res) => {
  try {
    const { token } = req.params;

    const ficha = await Ficha.findOne({ assinaturaToken: token }).populate(
      "funcionario"
    );

    if (!ficha) {
      return res
        .status(404)
        .json({ error: "Ficha não encontrada ou token inválido" });
    }

    if (tokenExpirado(ficha)) {
      ficha.assinaturaToken = null;
      ficha.assinaturaTokenExpiraEm = null;
      await ficha.save();

      return res.status(410).json({ error: "Link expirado" });
    }

    res.json({
      _id: ficha._id,
      funcionario: ficha.funcionario,
      header: ficha.header,
      mesReferencia: ficha.mesReferencia,
      anoReferencia: ficha.anoReferencia,
      jaAssinada: !!ficha.assinaturaFuncionario,
    });
  } catch (error) {
    console.error("Erro ao buscar ficha por token:", error);
    res.status(500).json({ error: error.message });
  }
};

/* =====================================================
   📌 3) ASSINAR FICHA VIA TOKEN
===================================================== */
export const assinarFichaPorToken = async (req, res) => {
  try {
    const { token } = req.params;
    const { assinaturaBase64 } = req.body;

    if (!assinaturaBase64) {
      return res.status(400).json({ error: "Assinatura é obrigatória" });
    }

    const ficha = await Ficha.findOne({ assinaturaToken: token });

    if (!ficha) {
      return res.status(404).json({ error: "Token inválido" });
    }

    if (tokenExpirado(ficha)) {
      ficha.assinaturaToken = null;
      ficha.assinaturaTokenExpiraEm = null;
      await ficha.save();
      return res.status(410).json({ error: "Link expirado" });
    }

    ficha.assinaturaFuncionario = assinaturaBase64;
    ficha.assinaturaToken = null;
    ficha.assinaturaTokenExpiraEm = null;
    await ficha.save();

    res.json({ message: "Assinatura registrada", fichaId: ficha._id });
  } catch (error) {
    console.error("Erro na assinatura:", error);
    res.status(500).json({ error: error.message });
  }
};
