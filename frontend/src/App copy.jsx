import { useEffect, useState } from "react";
import {
  Box,
  Button,
  Flex,
  Heading,
  Select,
  useToast,
  VStack,
  Text,
  List,
  ListItem,
  IconButton,
  AlertDialog,
  AlertDialogBody,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogContent,
  AlertDialogOverlay,
  HStack,
} from "@chakra-ui/react";
import { HamburgerIcon } from "@chakra-ui/icons";

import { useAuth } from "./contexts/AuthContext";


import { listarEmpregados } from "./services/empregadoService";
import { listarFichasPorFuncionario, atualizarFicha, buscarFichaPorId } from "./services/fichaService";

import InformacoesFuncionarios from "./components/InformacoesFuncionarios";
import NovoFuncionarioForm from "./components/NovoFuncionarioForm";
import TabelaRegistroPonto from "./components/registroPonto/TabelaRegistroPonto";
import ResumoGeral from "./components/resumoGeral/ResumoGeral";
import Login from "./pages/Login";

export default function App() {
  const toast = useToast();
  const { logout } = useAuth();

  const [aba, setAba] = useState("criar");
  const [menuAberto, setMenuAberto] = useState(false);

  const [empregados, setEmpregados] = useState([]);
  const [empregadoId, setEmpregadoId] = useState("");
  const [fichas, setFichas] = useState([]);
  const [fichaSelecionada, setFichaSelecionada] = useState(null);




  // ✅ Atualiza selects automaticamente
  const handleFuncionarioExcluido = (idExcluido) => {
    setEmpregados((prev) => prev.filter((e) => e._id !== idExcluido));

    if (empregadoId === idExcluido) {
      setEmpregadoId("");
      setFichas([]);
      setFichaSelecionada(null);
    }
  };

  const carregarEmpregados = async () => {
    try {
      const lista = await listarEmpregados();
      setEmpregados(lista);
    } catch {
      toast({
        title: "Erro ao carregar funcionários",
        status: "error",
        duration: 3500,
        isClosable: true,
      });
    }
  };

  useEffect(() => {
    carregarEmpregados();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleSelecionarFuncionario = async (id) => {
    setEmpregadoId(id);
    setFichaSelecionada(null);
    setFichas([]);

    if (!id) return;

    try {
      const historico = await listarFichasPorFuncionario(id);
      setFichas(historico);
    } catch {
      toast({
        title: "Erro ao carregar fichas",
        status: "error",
        duration: 3500,
        isClosable: true,
      });
    }
  };

  const handleSalvar = async () => {
    if (!fichaSelecionada?._id) return;
    try {
      const payload = {
        ...fichaSelecionada,
        diasDoMes: fichaSelecionada.diasDoMes || [],
        assinatura: fichaSelecionada.assinatura || ""
      };

      const atualizada = await atualizarFicha(fichaSelecionada._id, payload);
      setFichaSelecionada(atualizada);

      toast({
        title: "Ficha salva com sucesso!",
        status: "success",
        duration: 3000,
        isClosable: true,
      });
    } catch {
      toast({
        title: "Erro ao salvar ficha",
        status: "error",
        duration: 3500,
        isClosable: true,
      });
    }
  };


  return (
    <Flex minH="100vh" bg="gray.900" color="gray.100" justify="center" align="flex-start">
      {/* MENU */}
      <Box
        w={{ base: menuAberto ? "220px" : "0", md: "220px" }}
        p={menuAberto || window.innerWidth >= 768 ? 4 : 0}
        transition="0.3s"
        overflow="hidden"
      >
        <Heading size="md" mb={6}>Folha de Ponto</Heading>
        <List spacing={3}>
          {[
            ["criar", "Criar Funcionário"],
            ["pontos", "Pontos Funcionários"],
            ["resumo", "Resumo Geral"],
            ["informacoes", "Informações dos Funcionários"],
          ].map(([key, label]) => (
            <ListItem
              key={key}
              cursor="pointer"
              bg={aba === key ? "blue.600" : "transparent"}
              p={2}
              rounded="md"
              _hover={{ bg: "blue.700" }}
              onClick={() => setAba(key)}
            >
              {label}
            </ListItem>
          ))}
      <ListItem
        cursor="pointer"
        bg="red.600"
        p={2}
        rounded="md"
        onClick={logout}
      >
        Sair
      </ListItem>

        </List>
      </Box>

      {/* CONTEÚDO */}
      <Box flex="1" p={6}>
        <IconButton
          icon={<HamburgerIcon />}
          display={{ base: "block", md: "none" }}
          onClick={() => setMenuAberto(!menuAberto)}
          mb={4}
        />

        {/* Criar */}
        {aba === "criar" && (
          <>
            <Heading size="lg" mb={4}>Cadastrar Funcionário</Heading>
            <NovoFuncionarioForm onSaved={carregarEmpregados} />
          </>
        )}

        {/* Informações */}
        {aba === "informacoes" && (
          <>
            <Heading size="lg" mb={6}>Informações dos Funcionários</Heading>
            <InformacoesFuncionarios
              atualizarListaGlobal={carregarEmpregados}
              onFuncionarioExcluido={handleFuncionarioExcluido}
            />
          </>
        )}

        {/* Pontos Funcionários */}
        {aba === "pontos" && (
          <>
            <Heading size="lg" mb={6}>Pontos Funcionários</Heading>

            <VStack spacing={4}>
              <Select
                placeholder="Selecione o funcionário"
                value={empregadoId}
                onChange={(e) => handleSelecionarFuncionario(e.target.value)}
                bg="white"
                color="black"
              >
                {empregados.map((e) => (
                  <option key={e._id} value={e._id}>{e.nome}</option>
                ))}
              </Select>

              {fichas.length > 0 && (
                <HStack spacing={3} w="full">
                  <Select
                    flex="1"
                    value={fichaSelecionada?._id || ""}
                    onChange={async (e) =>
                      setFichaSelecionada(await buscarFichaPorId(e.target.value))
                    }
                    bg="white"
                    color="black"
                  >
                    <option value="" colorScheme="black">Selecione...</option>
                    {fichas.map((f) => (
                      <option key={f._id} value={f._id}>
                        {String(f.mesReferencia).padStart(2, "0")}/{f.anoReferencia}
                      </option>
                    ))}
                  </Select>
                </HStack>
              )}

              <Button
                colorScheme="blue"
                onClick={handleSalvar}
                isDisabled={!fichaSelecionada}
              >
                Salvar Ficha
              </Button>

              {fichaSelecionada && (
                <TabelaRegistroPonto fichaSelecionada={fichaSelecionada} setFichaSelecionada={setFichaSelecionada} />
              )}
            </VStack>
          </>
        )}

        {/* Resumo */}
        {aba === "resumo" && (
          <>
            <Heading size="lg" mb={6}>Resumo Geral</Heading>

            <VStack spacing={4}>
              <Select
                placeholder="Selecione funcionário"
                bg="white"
                color="black"
                value={empregadoId}
                onChange={(e) => handleSelecionarFuncionario(e.target.value)}
              >
                {empregados.map((e) => (
                  <option key={e._id} value={e._id}>{e.nome}</option>
                ))}
              </Select>

              {fichas.length > 0 && (
                <Select
                  placeholder="Selecione mês"
                  bg="white"
                  color="black"
                  value={fichaSelecionada?._id || ""}
                  onChange={async (e) =>
                    setFichaSelecionada(await buscarFichaPorId(e.target.value))
                  }
                >
                  {fichas.map((f) => (
                    <option key={f._id} value={f._id}>
                      {String(f.mesReferencia).padStart(2, "0")}/{f.anoReferencia}
                    </option>
                  ))}
                </Select>
              )}

              {fichaSelecionada ? (
                <ResumoGeral fichaSelecionada={fichaSelecionada} setFichaSelecionada={setFichaSelecionada} />
              ) : (
                <Box mt={10} textAlign="center" color="gray.400">
                  Selecione um funcionário e um mês
                </Box>
              )}
            </VStack>
          </>
        )}
      </Box>
    </Flex>
  );
}
