import Empregado from "../models/EmpregadoModel.js";
import Ficha from "../models/FichaModel.js";

// 🔹 Criar novo empregado + ficha inicial
export const criarEmpregado = async (req, res) => {
  try {
    const { empregado, header } = req.body;
    if (!empregado?.nome || !empregado?.cpf) {
      return res.status(400).json({ error: "Nome e CPF são obrigatórios." });
    }

    const nome = empregado.nome.trim();
    const cpf = empregado.cpf.replace(/\D/g, "");

    // 🔍 Verifica duplicidade
    const existente = await Empregado.findOne({
      $or: [{ cpf }, { nome: { $regex: new RegExp(`^${nome}$`, "i") } }],
    });

    if (existente) {
      return res.status(400).json({
        error: "Funcionário já existente com este nome ou CPF.",
      });
    }

    // 🔹 Dados completos
    const dadosCompletos = {
      ...empregado,
      ...header,
      cpf,
      nome,
      foto: empregado?.foto || header?.foto || "",
      dataAdmissao: header?.dataAdmissao ?? "",
      ctps: header?.ctpsNumeroESerie ?? "",
      horarioSegASex: header?.horarioSegASex ?? "",
      horarioSabado: header?.horarioSabado ?? "",
      descansoSemanal: header?.descansoSemanal ?? "",
      funcao: header?.funcao ?? "",
      empregadorNome: header?.empregadorNome ?? "",
      cnpjOuCei: header?.cnpjOuCei ?? "",
      endereco: header?.endereco ?? "",
      mesReferencia: Number(header?.mes ?? new Date().getMonth() + 1),
      anoReferencia: Number(header?.ano ?? new Date().getFullYear()),
    };

    const novoEmpregado = await Empregado.create(dadosCompletos);

    const novaFicha = await Ficha.create({
      funcionario: novoEmpregado._id,
      mesReferencia: dadosCompletos.mesReferencia,
      anoReferencia: dadosCompletos.anoReferencia,
      diasDoMes: [],
      resumoGeral: {
        diasHorasNormais: "",
        horasExtras: "",
        faltas: [],
        baseCalculo: "",
        inss: "",
        salarioFamilia: "",
        liquido: "",
      },
      assinatura: "",
    });

    return res.status(201).json({
      message: "Funcionário criado com sucesso",
      empregado: novoEmpregado,
      ficha: novaFicha,
    });
  } catch (error) {
    console.error("❌ Erro ao criar empregado:", error);

    if (error.code === 11000) {
      return res.status(400).json({
        error: "Funcionário com este CPF já existe.",
      });
    }

    return res.status(500).json({
      error: error.message || "Erro interno ao criar funcionário.",
    });
  }
};

// 🔹 Listar todos os empregados
export const listarEmpregados = async (req, res) => {
  try {
    const empregados = await Empregado.find().lean();
    res.json(empregados);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// 🔹 Buscar empregado por ID
export const buscarEmpregadoPorId = async (req, res) => {
  try {
    const { id } = req.params;
    const empregado = await Empregado.findById(id).lean();

    if (!empregado) {
      return res.status(404).json({ error: "Funcionário não encontrado" });
    }

    res.json(empregado);
  } catch (error) {
    res.status(500).json({ error: "Erro ao buscar funcionário" });
  }
};

// 🔹 Atualizar empregado
export const atualizarEmpregado = async (req, res) => {
  try {
    const { id } = req.params;
    const novosDados = req.body;

    const atual = await Empregado.findById(id);
    if (!atual) {
      return res.status(404).json({ error: "Funcionário não encontrado" });
    }

    const dadosAtualizados = {
      ...novosDados,
      foto: novosDados.foto || atual.foto || "",
    };

    const atualizado = await Empregado.findByIdAndUpdate(id, dadosAtualizados, { new: true });

    res.json(atualizado);
  } catch (error) {
    console.error("Erro ao atualizar funcionário:", error);
    res.status(500).json({ error: "Erro ao atualizar funcionário: " + error.message });
  }
};

// 🔹 Deletar empregado e fichas vinculadas
export const deletarEmpregado = async (req, res) => {
  try {
    const { id } = req.params;

    const empregado = await Empregado.findById(id);
    if (!empregado) {
      return res.status(404).json({ error: "Funcionário não encontrado" });
    }

    await Ficha.deleteMany({ funcionario: id });
    await Empregado.findByIdAndDelete(id);

    res.json({
      message: "Funcionário e fichas vinculadas foram excluídos com sucesso",
    });
  } catch (err) {
    res.status(500).json({ error: "Erro interno ao excluir funcionário" });
  }
};

/*  
====================================================================
🔥 NOVA ROTA — Atualizar assinatura padrão do gestor
====================================================================
*/
export const atualizarAssinaturaGestor = async (req, res) => {
  try {
    const { id } = req.params;
    const { assinaturaBase64 } = req.body;

    if (!assinaturaBase64) {
      return res.status(400).json({ error: "Assinatura base64 é obrigatória" });
    }

    const empregado = await Empregado.findById(id);
    if (!empregado) {
      return res.status(404).json({ error: "Funcionário não encontrado" });
    }

    empregado.assinaturaGestor = assinaturaBase64;
    await empregado.save();

    res.json({
      message: "Assinatura do gestor atualizada com sucesso",
      assinaturaGestor: assinaturaBase64,
    });
  } catch (error) {
    console.error("Erro ao salvar assinatura do gestor:", error);
    res.status(500).json({
      error: "Erro ao salvar assinatura do gestor",
      details: error.message,
    });
  }
};
