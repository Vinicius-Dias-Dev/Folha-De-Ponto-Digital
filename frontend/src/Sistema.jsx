// src/Sistema.jsx
import { useEffect, useCallback, useState } from "react";
import {
  Box,
  Select,
  VStack,
  Button,
  Text,
  Spinner,
  useToast,
  Flex
} from "@chakra-ui/react";
import { FiPlus, FiSave, FiRefreshCcw, FiCheck, FiTrash2 } from "react-icons/fi";
import { motion, AnimatePresence } from "framer-motion";

import LayoutDashboard from "./components/layout/LayoutDashboard";
import InformacoesFuncionarios from "./components/InformacoesFuncionarios";
import NovoFuncionarioForm from "./components/NovoFuncionarioForm";
import TabelaRegistroPonto from "./components/registroPonto/TabelaRegistroPonto";
import ResumoGeral from "./components/resumoGeral/ResumoGeral";

import { listarEmpregados } from "./services/empregadoService";
import {
  listarFichasPorFuncionario,
  atualizarFicha,
  buscarFichaPorId,
  criarFicha,
  deletarFicha
} from "./services/fichaService";
import { useAuth } from "./contexts/AuthContext";

const MotionBox = motion(Box);
const MotionButton = motion(Button);

const mesesNomes = [
  "Janeiro","Fevereiro","Março","Abril","Maio","Junho",
  "Julho","Agosto","Setembro","Outubro","Novembro","Dezembro",
];

export default function Sistema() {
  const toast = useToast();
  const { authReady } = useAuth();

  // ESTADO PONTOS
  const [aba, setAba] = useState("criar");
  const [empregados, setEmpregados] = useState([]);
  const [empregadoId, setEmpregadoId] = useState("");
  const [fichas, setFichas] = useState([]);
  const [fichaSelecionada, setFichaSelecionada] = useState(null);

  // ESTADO RESUMO GERAL
  const [empregadoResumoId, setEmpregadoResumoId] = useState("");
  const [fichasResumo, setFichasResumo] = useState([]);
  const [fichaResumoSelecionada, setFichaResumoSelecionada] = useState(null);

  const [loadingFicha, setLoadingFicha] = useState(false);
  const [loadingResumo, setLoadingResumo] = useState(false);
  const [salvando, setSalvando] = useState(false);
  const [ultimoSalvo, setUltimoSalvo] = useState(false);

  // CARREGAR FUNCIONÁRIOS
  const carregarEmpregados = useCallback(async () => {
    try {
      const data = await listarEmpregados();
      setEmpregados(data);
    } catch {
      toast({ title: "Erro ao carregar funcionários", status: "error" });
    }
  }, [toast]);

  // SYNC AUTOMÁTICO LISTA EMPREGADOS
  useEffect(() => {
    const atualizar = async () => {
      const data = await listarEmpregados();
      setEmpregados(data);

      const ids = data.map((e) => e._id);

      if (empregadoId && !ids.includes(empregadoId)) {
        setEmpregadoId("");
        setFichaSelecionada(null);
        setFichas([]);
      }

      if (empregadoResumoId && !ids.includes(empregadoResumoId)) {
        setEmpregadoResumoId("");
        setFichaResumoSelecionada(null);
        setFichasResumo([]);
      }
    };

    atualizar();
    const i = setInterval(atualizar, 2000);
    return () => clearInterval(i);
  }, [empregadoId, empregadoResumoId]);

  // ========= PONTOS =========

  const handleSelecionarFuncionario = async (id) => {
    setEmpregadoId(id);
    setFichaSelecionada(null);

    if (!id) return setFichas([]);

    try {
      setLoadingFicha(true);
      const lista = await listarFichasPorFuncionario(id);

      const ordenada = [...lista].sort(
        (a, b) =>
          b.anoReferencia - a.anoReferencia ||
          b.mesReferencia - a.mesReferencia
      );

      setFichas(ordenada);

      if (ordenada.length > 0) {
        const ficha = await buscarFichaPorId(ordenada[0]._id);
        await new Promise((r) => setTimeout(r, 300));
        setFichaSelecionada(ficha);
      }
    } finally {
      setLoadingFicha(false);
    }
  };

  const handleSelecionarFicha = async (id) => {
    if (!id) return;
    try {
      setLoadingFicha(true);
      const ficha = await buscarFichaPorId(id);
      await new Promise((r) => setTimeout(r, 300));
      setFichaSelecionada(ficha);
    } finally {
      setLoadingFicha(false);
    }
  };

  const handleSalvar = async () => {
    try {
      setSalvando(true);
      const atualizada = await atualizarFicha(
        fichaSelecionada._id,
        fichaSelecionada
      );
      setFichaSelecionada(atualizada);
      setUltimoSalvo(true);
      toast({ title: "Ficha salva com sucesso", status: "success" });
      setTimeout(() => setUltimoSalvo(false), 2000);
    } finally {
      setSalvando(false);
    }
  };

  const handleAtualizar = async () => {
    try {
      setLoadingFicha(true);
      const atual = await buscarFichaPorId(fichaSelecionada._id);
      await new Promise((r) => setTimeout(r, 300));
      setFichaSelecionada(atual);
    } finally {
      setLoadingFicha(false);
    }
  };

  const handleExcluirFicha = async () => {
    if (!fichaSelecionada?._id) return;

    const confirm = window.confirm(
      `Excluir a ficha de ${mesesNomes[fichaSelecionada.mesReferencia - 1]}/${fichaSelecionada.anoReferencia}?`
    );
    if (!confirm) return;

    try {
      await deletarFicha(fichaSelecionada._id);

      toast({ title: "Ficha excluída!", status: "success" });

      const novas = fichas.filter((f) => f._id !== fichaSelecionada._id);
      setFichas(novas);
      setFichaSelecionada(null);

    } catch (err) {
      toast({
        title: "Erro ao excluir",
        description: err.message,
        status: "error",
      });
    }
  };

  const handleCriarNovoMes = async () => {
    try {
      setLoadingFicha(true);

      let novoMes, novoAno;
      if (fichas.length > 0) {
        const ultima = fichas[0];
        novoMes = ultima.mesReferencia + 1;
        novoAno = ultima.anoReferencia;
        if (novoMes > 12) {
          novoMes = 1;
          novoAno++;
        }
      } else {
        const hoje = new Date();
        novoMes = hoje.getMonth() + 1;
        novoAno = hoje.getFullYear();
      }

      const payload = {
        funcionario: empregadoId,
        mesReferencia: novoMes,
        anoReferencia: novoAno,
        diasDoMes: Array.from({ length: 31 }, (_, i) => ({
          data: i + 1,
          entrada: "",
          saidaAlmoco: "",
          entradaAlmoco: "",
          saida: "",
          extraEntrada: "",
          extraSaida: "",
        })),
        assinatura: "",
      };

      const nova = await criarFicha(payload);

      const novaOrdenada = [nova, ...fichas].sort(
        (a, b) =>
          b.anoReferencia - a.anoReferencia ||
          b.mesReferencia - a.mesReferencia
      );
      setFichas(novaOrdenada);

      const fichaCompleta = await buscarFichaPorId(nova._id);
      await new Promise((r) => setTimeout(r, 300));
      setFichaSelecionada(fichaCompleta);

      toast({
        title: `Novo mês criado: ${mesesNomes[novoMes - 1]}/${novoAno}`,
        status: "success",
      });
    } finally {
      setLoadingFicha(false);
    }
  };

  // ========= RESUMO GERAL =========

  const handleSelecionarFuncionarioResumo = async (id) => {
    setEmpregadoResumoId(id);
    setFichaResumoSelecionada(null);
    setFichasResumo([]);

    if (!id) return;

    try {
      setLoadingResumo(true);
      const lista = await listarFichasPorFuncionario(id);

      const ordenada = [...lista].sort(
        (a, b) =>
          b.anoReferencia - a.anoReferencia ||
          b.mesReferencia - a.mesReferencia
      );

      await new Promise((r) => setTimeout(r, 200));
      setFichasResumo(ordenada);
    } finally {
      setLoadingResumo(false);
    }
  };

  const handleSelecionarFichaResumo = async (id) => {
    if (!id) return;
    try {
      setLoadingResumo(true);
      const ficha = await buscarFichaPorId(id);
      await new Promise((r) => setTimeout(r, 200));
      setFichaResumoSelecionada(ficha);
    } finally {
      setLoadingResumo(false);
    }
  };

  if (!authReady) return <Text color="gray.300">Carregando...</Text>;

  return (
    <Box bg="#0D1117" minH="100vh">
      <LayoutDashboard currentTab={aba} onChangeTab={setAba}>
        <Box maxW="1100px" mx="auto" w="100%" px={2} pt={4}>

          {/* ============ ABA PONTOS ============ */}
          {aba === "pontos" && (
            <VStack spacing={4} w="100%">

              <Select
                placeholder="Selecione funcionário"
                value={empregadoId}
                onChange={(e) => handleSelecionarFuncionario(e.target.value)}
                bg="gray.800"
                borderColor="gray.600"
                color="white"
              >
                {empregados.map((e) => (
                  <option key={e._id} value={e._id} style={{ color: "black" }}>
                    {e.nome}
                  </option>
                ))}
              </Select>

              {fichas.length > 0 && (
                <Select
                  value={fichaSelecionada?._id || ""}
                  onChange={(e) => handleSelecionarFicha(e.target.value)}
                  bg="gray.800"
                  borderColor="gray.600"
                  color="white"
                >
                  {fichas.map((f) => (
                    <option key={f._id} value={f._id} style={{ color: "black" }}>
                      {mesesNomes[f.mesReferencia - 1]} / {f.anoReferencia}
                    </option>
                  ))}
                </Select>
              )}

              {fichaSelecionada && !loadingFicha && (
                <Flex
                  w="100%"
                  bg="#161b22"
                  p={3}
                  border="1px solid"
                  borderColor="gray.700"
                  rounded="md"
                  shadow="md"
                  gap={3}
                >
                  <MotionButton
                    leftIcon={<FiRefreshCcw />}
                    bg="gray.600"
                    color="white"
                    _hover={{ bg: "gray.500" }}
                    onClick={handleAtualizar}
                  >
                    Atualizar
                  </MotionButton>

                  <MotionButton
                    leftIcon={ultimoSalvo ? <FiCheck /> : <FiSave />}
                    colorScheme="blue"
                    isLoading={salvando}
                    loadingText="Salvando"
                    onClick={handleSalvar}
                  >
                    {ultimoSalvo ? "Salvo!" : "Salvar Ficha"}
                  </MotionButton>

                  <MotionButton
                    leftIcon={<FiPlus />}
                    bg="green.600"
                    color="white"
                    _hover={{ bg: "green.500" }}
                    onClick={handleCriarNovoMes}
                  >
                    Novo Mês
                  </MotionButton>

                  {/* 🗑️ EXCLUIR MÊS */}
                  <MotionButton
                    leftIcon={<FiTrash2 />}
                    bg="red.600"
                    color="white"
                    _hover={{ bg: "red.500" }}
                    onClick={handleExcluirFicha}
                  >
                    Excluir Mês
                  </MotionButton>
                </Flex>
              )}

              <AnimatePresence mode="wait">
                {loadingFicha && (
                  <MotionBox
                    key="spin"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                  >
                    <Spinner size="xl" color="blue.400" mt={4} />
                  </MotionBox>
                )}

                {!loadingFicha && fichaSelecionada && (
                  <MotionBox
                    key="table"
                    initial={{ opacity: 0, y: 25 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -25 }}
                    transition={{ duration: 0.4 }}
                    w="100%"
                  >
                    <TabelaRegistroPonto
                      fichaSelecionada={fichaSelecionada}
                      setFichaSelecionada={setFichaSelecionada}
                    />
                  </MotionBox>
                )}
              </AnimatePresence>
            </VStack>
          )}

          {/* ============ ABA RESUMO ============ */}
          {aba === "resumo" && (
            <VStack spacing={4} w="100%">
              <Select
                placeholder="Selecione funcionário"
                value={empregadoResumoId}
                onChange={(e) => handleSelecionarFuncionarioResumo(e.target.value)}
                bg="gray.800"
                borderColor="gray.600"
                color="white"
              >
                {empregados.map((e) => (
                  <option key={e._id} value={e._id} style={{ color: "black" }}>
                    {e.nome}
                  </option>
                ))}
              </Select>

              {fichasResumo.length > 0 && (
                <Select
                  placeholder="Selecione mês"
                  value={fichaResumoSelecionada?._id || ""}
                  onChange={(e) => handleSelecionarFichaResumo(e.target.value)}
                  bg="gray.800"
                  borderColor="gray.600"
                  color="white"
                >
                  {fichasResumo.map((f) => (
                    <option key={f._id} value={f._id} style={{ color: "black" }}>
                      {mesesNomes[f.mesReferencia - 1]} / {f.anoReferencia}
                    </option>
                  ))}
                </Select>
              )}

              <AnimatePresence mode="wait">
                {loadingResumo && (
                  <MotionBox
                    key="spinResumo"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                  >
                    <Spinner size="lg" color="blue.400" mt={4} />
                  </MotionBox>
                )}

                {!loadingResumo && fichaResumoSelecionada && (
                  <MotionBox
                    key="resumoBox"
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -20 }}
                    transition={{ duration: 0.35 }}
                    w="100%"
                  >
                    <ResumoGeral
                      fichaSelecionada={fichaResumoSelecionada}
                      setFichaSelecionada={setFichaResumoSelecionada}
                    />
                  </MotionBox>
                )}
              </AnimatePresence>
            </VStack>
          )}

          {aba === "criar" && (
            <NovoFuncionarioForm onSaved={carregarEmpregados} />
          )}

          {aba === "informacoes" && (
            <InformacoesFuncionarios atualizarListaGlobal={carregarEmpregados} />
          )}
        </Box>
      </LayoutDashboard>
    </Box>
  );
}
