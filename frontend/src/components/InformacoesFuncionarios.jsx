// src/components/InformacoesFuncionarios.jsx
import { useState, useEffect, useRef } from "react";
import {
  Box,
  FormControl,
  FormLabel,
  Input,
  Button,
  Select,
  useToast,
  Grid,
  HStack,
  AlertDialog,
  AlertDialogBody,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogContent,
  AlertDialogOverlay,
  Text,
  Spinner,
  useDisclosure,
  Flex,
  Avatar,
  Image,
  Modal,
  ModalOverlay,
  ModalContent,
  ModalHeader,
  ModalBody,
  ModalFooter,
  ModalCloseButton,
  Tabs,
  TabList,
  TabPanels,
  Tab,
  TabPanel,
  InputGroup,
  InputRightElement,
  IconButton,
  Badge, // 👈 ADICIONADO
} from "@chakra-ui/react";
import { motion } from "framer-motion";
import {
  FiSave,
  FiTrash2,
  FiEdit3,
  FiCopy,
  FiLink,
  FiCheckCircle, // 👈 ADICIONADO
  FiClock, // 👈 ADICIONADO
} from "react-icons/fi";
import SignatureCanvas from "react-signature-canvas";

import {
  listarEmpregados,
  atualizarEmpregado,
  deletarEmpregado,
} from "../services/empregadoService";
import { listarFichasPorFuncionario } from "../services/fichaService";
import GeradorPDF from "./GeradorPDF";
import { getAccessToken } from "../services/tokenService";

const MotionBox = motion(Box);
const MotionButton = motion(Button);

export default function InformacoesFuncionarios({
  atualizarListaGlobal,
  onFuncionarioExcluido,
}) {
  const toast = useToast();
  const apiURL = import.meta.env.VITE_API_BASE_URL;

  const [empregados, setEmpregados] = useState([]);
  const [empregadoId, setEmpregadoId] = useState("");
  const [fichas, setFichas] = useState([]);
  const [loading, setLoading] = useState(false);

  // modal de exclusão
  const {
    isOpen: isDeleteOpen,
    onOpen: onDeleteOpen,
    onClose: onDeleteClose,
  } = useDisclosure();
  const cancelRef = useRef();
  const [idParaExcluir, setIdParaExcluir] = useState(null);

  const [fotoUploading, setFotoUploading] = useState(false);

  const [dados, setDados] = useState({
    nome: "",
    cpf: "",
    funcao: "",
    ctps: "",
    dataAdmissao: "",
    horarioSegASex: "",
    horarioSabado: "",
    descansoSemanal: "",
    empregadorNome: "",
    cnpjOuCei: "",
    endereco: "",
    foto: "",
  });

  // ==============================
  //   ASSINATURA GLOBAL DO GESTOR
  // ==============================
  const {
    isOpen: isGestorOpen,
    onOpen: onGestorOpen,
    onClose: onGestorClose,
  } = useDisclosure();

  const gestCanvasRef = useRef(null);
  const [salvandoAssGestor, setSalvandoAssGestor] = useState(false);
  const [gestorLink, setGestorLink] = useState("");
  const [gerandoLinkGestor, setGerandoLinkGestor] = useState(false);
  const [assinaturaGlobalAtual, setAssinaturaGlobalAtual] = useState("");

  const getAuthToken = () =>
    getAccessToken() ||
    localStorage.getItem("accessToken") ||
    localStorage.getItem("@folha:token");

  const statusGestorAssinado = !!assinaturaGlobalAtual; // 👈 usado no badge

  // quando abrir o modal do gestor, busca assinatura salva (se existir)
  useEffect(() => {
    if (!isGestorOpen) return;

    const carregarAssinaturaGlobal = async () => {
      const token = getAuthToken();
      if (!token) return;

      try {
        const res = await fetch(`${apiURL}/config/assinatura-gestor`, {
          headers: { Authorization: `Bearer ${token}` },
        });

        const data = await res.json();
        if (!res.ok) throw new Error(data.error || "Erro ao carregar assinatura");

        // backend devolve { assinaturaGestor }
        setAssinaturaGlobalAtual(data.assinaturaGestor || "");
      } catch (err) {
        console.warn(
          "Não foi possível carregar assinatura global:",
          err.message
        );
      }
    };

    carregarAssinaturaGlobal();
  }, [isGestorOpen, apiURL]);

  // 👇 carregar também ao montar o componente (para o PDF já ter a assinatura)
  useEffect(() => {
    const carregarAssinaturaGlobal = async () => {
      const token = getAuthToken();
      if (!token) return;

      try {
        const res = await fetch(`${apiURL}/config/assinatura-gestor`, {
          headers: { Authorization: `Bearer ${token}` },
        });

        const data = await res.json();
        if (!res.ok) throw new Error(data.error || "Erro ao carregar assinatura");

        setAssinaturaGlobalAtual(data.assinaturaGestor || "");
      } catch (err) {
        console.warn(
          "Não foi possível carregar assinatura global (init):",
          err.message
        );
      }
    };

    carregarAssinaturaGlobal();
  }, [apiURL]);

  // SALVAR ASSINATURA MANUAL (PUT /config/assinatura-gestor)
  const salvarAssinaturaGestor = async () => {
    if (!gestCanvasRef.current) return;

    const token = getAuthToken();
    if (!token) {
      toast({
        title: "Token ausente",
        description: "Faça login novamente.",
        status: "error",
      });
      return;
    }

    try {
      setSalvandoAssGestor(true);

      const base64 = gestCanvasRef.current
        .getCanvas()
        .toDataURL("image/png");

      const res = await fetch(`${apiURL}/config/assinatura-gestor`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ assinaturaBase64: base64 }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Erro ao salvar assinatura");

      setAssinaturaGlobalAtual(base64);
      toast({ title: "Assinatura do gestor salva!", status: "success" });
      onGestorClose();
    } catch (err) {
      toast({
        title: "Erro ao salvar assinatura",
        description: err.message,
        status: "error",
      });
    } finally {
      setSalvandoAssGestor(false);
    }
  };

  // GERAR LINK DO GESTOR (POST /config/assinatura-gestor/link)
  const gerarLinkGestor = async () => {
    const token = getAuthToken();
    if (!token) {
      toast({
        title: "Token ausente",
        description: "Faça login novamente.",
        status: "error",
      });
      return;
    }

    try {
      setGerandoLinkGestor(true);

      const res = await fetch(`${apiURL}/config/assinatura-gestor/link`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Erro ao gerar link");

      // backend devolve { token, urlAssinatura }
      setGestorLink(
        data.urlAssinatura ||
          `${import.meta.env.VITE_FRONTEND_BASE_URL}/assinatura-gestor/${data.token}`
      );

      toast({ title: "Link gerado!", status: "success" });
    } catch (err) {
      toast({
        title: "Erro ao gerar link",
        description: err.message,
        status: "error",
      });
    } finally {
      setGerandoLinkGestor(false);
    }
  };

  const copiarLinkGestor = async () => {
    try {
      await navigator.clipboard.writeText(gestorLink);
      toast({ title: "Link copiado!", status: "success" });
    } catch {
      toast({ title: "Erro ao copiar link", status: "error" });
    }
  };

  // ==============================
  //   CARREGAR LISTA DE EMPREGADOS
  // ==============================
  useEffect(() => {
    const carregar = async () => {
      try {
        setEmpregados(await listarEmpregados());
      } catch {
        toast({ title: "Erro ao carregar funcionários", status: "error" });
      }
    };
    carregar();
  }, [toast]);

  // ==============================
  //   SELEÇÃO DE FUNCIONÁRIO
  // ==============================
  const handleSelect = async (id) => {
    setEmpregadoId(id);
    if (!id) return;

    try {
      setLoading(true);
      const emp = empregados.find((e) => e._id === id);

      setDados({
        nome: emp?.nome ?? "",
        cpf: emp?.cpf ?? "",
        funcao: emp?.funcao ?? "",
        ctps: emp?.ctps ?? "",
        dataAdmissao: emp?.dataAdmissao?.slice(0, 10) ?? "",
        horarioSegASex: emp?.horarioSegASex ?? "",
        horarioSabado: emp?.horarioSabado ?? "",
        descansoSemanal: emp?.descansoSemanal ?? "",
        empregadorNome: emp?.empregadorNome ?? "",
        cnpjOuCei: emp?.cnpjOuCei ?? "",
        endereco: emp?.endereco ?? "",
        foto: emp?.foto || "",
      });

      setFichas(await listarFichasPorFuncionario(id));
    } finally {
      setLoading(false);
    }
  };

  const atualizarCampo = (campo, valor) => {
    setDados((prev) => ({ ...prev, [campo]: valor }));
  };

  // ==============================
  //   UPLOAD DE FOTO
  // ==============================
  const handleUploadFoto = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    setFotoUploading(true);
    try {
      const formData = new FormData();
      formData.append("file", file);
      formData.append(
        "upload_preset",
        import.meta.env.VITE_CLOUDINARY_UPLOAD_PRESET
      );

      const res = await fetch(
        `https://api.cloudinary.com/v1_1/${
          import.meta.env.VITE_CLOUDINARY_CLOUD_NAME
        }/image/upload`,
        {
          method: "POST",
          body: formData,
        }
      );

      const dataImg = await res.json();
      setDados((prev) => ({ ...prev, foto: dataImg.secure_url }));

      toast({ title: "Foto enviada!", status: "success" });
    } catch {
      toast({ title: "Erro ao enviar foto", status: "error" });
    } finally {
      setFotoUploading(false);
    }
  };

  // ==============================
  //   SALVAR DADOS DO FUNCIONÁRIO
  // ==============================
  const handleSalvar = async () => {
    if (!empregadoId) return;

    try {
      const atualizado = await atualizarEmpregado(empregadoId, {
        ...dados,
      });

      setEmpregados((prev) =>
        prev.map((e) => (e._id === atualizado._id ? atualizado : e))
      );

      toast({ title: "Alterações salvas!", status: "success" });
      atualizarListaGlobal?.();
    } catch {
      toast({ title: "Erro ao salvar", status: "error" });
    }
  };

  // ==============================
  //   EXCLUIR FUNCIONÁRIO
  // ==============================
  const handleExcluir = async () => {
    try {
      await deletarEmpregado(idParaExcluir);

      toast({ title: "Funcionário excluído!", status: "success" });

      setEmpregadoId("");
      setDados({
        nome: "",
        cpf: "",
        funcao: "",
        ctps: "",
        dataAdmissao: "",
        horarioSegASex: "",
        horarioSabado: "",
        descansoSemanal: "",
        empregadorNome: "",
        cnpjOuCei: "",
        endereco: "",
        foto: "",
      });
      setFichas([]);

      onFuncionarioExcluido?.(idParaExcluir);
      atualizarListaGlobal?.();

      onDeleteClose();
    } catch {
      toast({ title: "Erro ao excluir", status: "error" });
    }
  };

  // ==============================
  //   RENDER
  // ==============================
  return (
    <MotionBox initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
      {/* Seleção + botões topo */}
      <Box
        bg="#161b22"
        p={4}
        rounded="md"
        border="1px solid"
        borderColor="gray.700"
        shadow="md"
      >
        <Flex gap={4} direction={{ base: "column", md: "row" }}>
          <FormControl>
            <FormLabel color="gray.300" fontSize="sm">
              Funcionário
            </FormLabel>
            <Select
              value={empregadoId}
              placeholder="Selecione"
              onChange={(e) => handleSelect(e.target.value)}
              bg="gray.800"
              color="white"
            >
              {empregados.map((e) => (
                <option key={e._id} value={e._id} style={{ color: "black" }}>
                  {e.nome}
                </option>
              ))}
            </Select>
          </FormControl>

          <HStack align="end">
            {/* 👇 agora o PDF recebe a assinatura do gestor também */}
            <GeradorPDF
              funcionario={dados}
              fichas={fichas}
              assinaturaGestor={assinaturaGlobalAtual}
            />

            {/* Botão para modal da assinatura global do gestor */}
            <Button
              leftIcon={<FiEdit3 />}
              colorScheme="yellow"
              onClick={onGestorOpen}
            >
              Assinatura do Gestor
            </Button>
          </HStack>
        </Flex>
      </Box>

      {loading && (
        <Flex justify="center" py={6}>
          <Spinner size="lg" color="blue.400" />
        </Flex>
      )}

      {!loading && empregadoId && (
        <MotionBox
          bg="#0f141b"
          mt={6}
          p={6}
          rounded="lg"
          border="1px solid"
          borderColor="gray.800"
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
        >
          {/* Foto + Nome */}
          <Flex align="center" gap={4} mb={6}>
            <Avatar
              name={dados.nome}
              src={dados.foto || ""}
              size="md"
              bg="gray.700"
              border="2px solid #2a4365"
            />

            <Box>
              <Text fontWeight="bold" color="white">
                {dados.nome}
              </Text>
              <Text color="gray.400" fontSize="sm">
                {dados.funcao || "Função não informada"}
              </Text>
            </Box>

            <Input
              id="uploadFotoInfo"
              type="file"
              accept="image/*"
              display="none"
              onChange={handleUploadFoto}
            />

            <Button
              as="label"
              htmlFor="uploadFotoInfo"
              size="sm"
              variant="outline"
              colorScheme="blue"
              isDisabled={fotoUploading}
            >
              {fotoUploading ? "Enviando..." : "Alterar"}
            </Button>
          </Flex>

          {/* Dados pessoais */}
          <Grid templateColumns={{ base: "1fr", md: "repeat(2, 1fr)" }} gap={4}>
            <FormControl>
              <FormLabel color="gray.400">Nome</FormLabel>
              <Input
                bg="gray.900"
                borderColor="gray.700"
                color="white"
                value={dados.nome}
                onChange={(e) => atualizarCampo("nome", e.target.value)}
              />
            </FormControl>

            <FormControl>
              <FormLabel color="gray.400">CPF</FormLabel>
              <Input
                bg="gray.900"
                borderColor="gray.700"
                color="white"
                value={dados.cpf}
                onChange={(e) => atualizarCampo("cpf", e.target.value)}
              />
            </FormControl>

            <FormControl>
              <FormLabel color="gray.400">Função</FormLabel>
              <Input
                bg="gray.900"
                borderColor="gray.700"
                color="white"
                value={dados.funcao}
                onChange={(e) => atualizarCampo("funcao", e.target.value)}
              />
            </FormControl>

            <FormControl>
              <FormLabel color="gray.400">Data de admissão</FormLabel>
              <Input
                type="date"
                bg="gray.900"
                borderColor="gray.700"
                color="white"
                value={dados.dataAdmissao}
                onChange={(e) =>
                  atualizarCampo("dataAdmissao", e.target.value)
                }
              />
            </FormControl>
          </Grid>

          {/* Jornada */}
          <Box mt={6}>
            <Grid
              templateColumns={{
                base: "1fr",
                sm: "1fr 1fr",
                md: "1fr 1fr 1fr",
              }}
              gap={6}
            >
              <FormControl>
                <FormLabel color="gray.400">Horário Semana</FormLabel>
                <Input
                  bg="gray.900"
                  borderColor="gray.700"
                  color="white"
                  value={dados.horarioSegASex}
                  onChange={(e) =>
                    atualizarCampo("horarioSegASex", e.target.value)
                  }
                />
              </FormControl>

              <FormControl>
                <FormLabel color="gray.400">Horário Sábado</FormLabel>
                <Input
                  bg="gray.900"
                  borderColor="gray.700"
                  color="white"
                  value={dados.horarioSabado}
                  onChange={(e) =>
                    atualizarCampo("horarioSabado", e.target.value)
                  }
                />
              </FormControl>

              <FormControl>
                <FormLabel color="gray.400">Descanso</FormLabel>
                <Select
                  bg="gray.900"
                  borderColor="gray.700"
                  color="white"
                  value={dados.descansoSemanal}
                  onChange={(e) =>
                    atualizarCampo("descansoSemanal", e.target.value)
                  }
                >
                  <option style={{ color: "black" }} value="">
                    Selecione
                  </option>
                  <option style={{ color: "black" }} value="Domingo">
                    Domingo
                  </option>
                  <option style={{ color: "black" }} value="Segunda-feira">
                    Segunda-feira
                  </option>
                  <option style={{ color: "black" }} value="Terça-feira">
                    Terça-feira
                  </option>
                  <option style={{ color: "black" }} value="Quarta-feira">
                    Quarta-feira
                  </option>
                  <option style={{ color: "black" }} value="Quinta-feira">
                    Quinta-feira
                  </option>
                  <option style={{ color: "black" }} value="Sexta-feira">
                    Sexta-feira
                  </option>
                  <option style={{ color: "black" }} value="Sábado">
                    Sábado
                  </option>
                </Select>
              </FormControl>
            </Grid>
          </Box>

          {/* Empresa */}
          <Box mt={6}>
            <Grid templateColumns={{ base: "1fr", md: "repeat(2, 1fr)" }} gap={4}>
              <FormControl>
                <FormLabel color="gray.400">Empresa</FormLabel>
                <Input
                  bg="gray.900"
                  borderColor="gray.700"
                  color="white"
                  value={dados.empregadorNome}
                  onChange={(e) =>
                    atualizarCampo("empregadorNome", e.target.value)
                  }
                />
              </FormControl>

              <FormControl>
                <FormLabel color="gray.400">CNPJ/CEI</FormLabel>
                <Input
                  bg="gray.900"
                  borderColor="gray.700"
                  color="white"
                  value={dados.cnpjOuCei}
                  onChange={(e) =>
                    atualizarCampo("cnpjOuCei", e.target.value)
                  }
                />
              </FormControl>

              <FormControl>
                <FormLabel color="gray.400">Endereço</FormLabel>
                <Input
                  bg="gray.900"
                  borderColor="gray.700"
                  color="white"
                  value={dados.endereco}
                  onChange={(e) =>
                    atualizarCampo("endereco", e.target.value)
                  }
                />
              </FormControl>
            </Grid>
          </Box>

          {/* Botões */}
          <Flex justify="space-between" mt={8}>
            <MotionButton
              leftIcon={<FiSave />}
              colorScheme="blue"
              whileHover={{ y: -2 }}
              whileTap={{ scale: 0.98 }}
              onClick={handleSalvar}
            >
              Salvar Alterações
            </MotionButton>

            <MotionButton
              leftIcon={<FiTrash2 />}
              colorScheme="red"
              whileHover={{ y: -2 }}
              whileTap={{ scale: 0.98 }}
              onClick={() => {
                setIdParaExcluir(empregadoId);
                onDeleteOpen();
              }}
            >
              Excluir Funcionário
            </MotionButton>
          </Flex>
        </MotionBox>
      )}

      {/* Modal Exclusão */}
      <AlertDialog
        isOpen={isDeleteOpen}
        leastDestructiveRef={cancelRef}
        onClose={onDeleteClose}
      >
        <AlertDialogOverlay />
        <AlertDialogContent
          bg="#161b22"
          borderColor="gray.600"
          borderWidth="1px"
        >
          <AlertDialogHeader color="white">
            Excluir Funcionário?
          </AlertDialogHeader>
          <AlertDialogBody color="gray.300">
            Esta ação não pode ser desfeita.
          </AlertDialogBody>
          <AlertDialogFooter>
            <Button ref={cancelRef} onClick={onDeleteClose}>
              Cancelar
            </Button>
            <Button colorScheme="red" ml={3} onClick={handleExcluir}>
              Excluir
            </Button>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Modal Assinatura GLOBAL do Gestor */}
      <Modal
        isOpen={isGestorOpen}
        onClose={onGestorClose}
        size="lg"
        isCentered
      >
        <ModalOverlay />
        <ModalContent bg="gray.800" border="1px solid #333" color="white">
          <ModalHeader>Assinatura do Gestor</ModalHeader>
          <ModalCloseButton />

          <ModalBody>
            <Tabs isFitted variant="enclosed" colorScheme="blue">
              <TabList mb={4}>
                <Tab>Assinatura Manual</Tab>
                <Tab>Link de Assinatura</Tab>
              </TabList>

              <TabPanels>
                {/* Aba 1 - Manual */}
                <TabPanel>
                  {/* STATUS DO GESTOR */}
                  <HStack justify="space-between" mb={3}>
                    <Text fontSize="sm">Status:</Text>
                    <Badge
                      colorScheme={statusGestorAssinado ? "green" : "yellow"}
                      display="flex"
                      alignItems="center"
                      gap={1}
                    >
                      {statusGestorAssinado ? (
                        <>
                          <FiCheckCircle /> Assinatura cadastrada
                        </>
                      ) : (
                        <>
                          <FiClock /> Pendente
                        </>
                      )}
                    </Badge>
                  </HStack>

                  {assinaturaGlobalAtual && (
                    <Box mb={4}>
                      <Text fontSize="sm" color="gray.300" mb={1}>
                        Assinatura atual:
                      </Text>
                      <Image
                        src={assinaturaGlobalAtual}
                        alt="Assinatura atual"
                        bg="white"
                        maxH="120px"
                        p={2}
                        borderRadius="md"
                        border="1px solid #444"
                      />
                    </Box>
                  )}

                  <Box
                    bg="white"
                    border="2px solid #444"
                    rounded="md"
                    overflow="hidden"
                  >
                    <SignatureCanvas
                      ref={gestCanvasRef}
                      penColor="black"
                      canvasProps={{
                        width: 500,
                        height: 200,
                        className: "signatureCanvasGestor",
                      }}
                    />
                  </Box>

                  <Button
                    colorScheme="red"
                    mt={3}
                    size="sm"
                    onClick={() => gestCanvasRef.current?.clear()}
                  >
                    Limpar
                  </Button>
                </TabPanel>

                {/* Aba 2 - Link */}
                <TabPanel>
                  <Text fontSize="sm" color="gray.300" mb={2}>
                    Gere um link para o gestor assinar de qualquer lugar.
                  </Text>

                  <Button
                    leftIcon={<FiLink />}
                    colorScheme="blue"
                    onClick={gerarLinkGestor}
                    isLoading={gerandoLinkGestor}
                    width="100%"
                    mb={3}
                  >
                    Gerar link de assinatura do gestor
                  </Button>

                  {gestorLink && (
                    <InputGroup>
                      <Input
                        bg="gray.900"
                        value={gestorLink}
                        isReadOnly
                        fontSize="xs"
                      />
                      <InputRightElement>
                        <IconButton
                          aria-label="Copiar link"
                          icon={<FiCopy />}
                          size="sm"
                          variant="ghost"
                          onClick={copiarLinkGestor}
                        />
                      </InputRightElement>
                    </InputGroup>
                  )}
                </TabPanel>
              </TabPanels>
            </Tabs>
          </ModalBody>

          <ModalFooter>
            <Button mr={3} onClick={onGestorClose}>
              Fechar
            </Button>
            <Button
              colorScheme="green"
              onClick={salvarAssinaturaGestor}
              isLoading={salvandoAssGestor}
            >
              Salvar Assinatura Manual
            </Button>
          </ModalFooter>
        </ModalContent>
      </Modal>
    </MotionBox>
  );
}
