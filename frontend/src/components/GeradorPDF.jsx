import { useState, useEffect } from "react";
import {
  Button,
  VStack,
  Text,
  Modal,
  ModalOverlay,
  ModalContent,
  ModalHeader,
  ModalBody,
  ModalFooter,
  ModalCloseButton,
  Select,
  useDisclosure,
  useToast,
  Tabs,
  TabList,
  TabPanels,
  Tab,
  TabPanel,
  HStack,
  Input,
  InputGroup,
  InputRightElement,
  IconButton,
  Badge,
  FormControl,
} from "@chakra-ui/react";

import {
  FiCopy,
  FiLink,
  FiCheckCircle,
  FiFileText,
  FiClock,
} from "react-icons/fi";

import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import { motion } from "framer-motion";
import { useAuth } from "../contexts/AuthContext";
import { getAccessToken } from "../services/tokenService";

const mesesNomes = [
  "Janeiro","Fevereiro","Março","Abril","Maio","Junho",
  "Julho","Agosto","Setembro","Outubro","Novembro","Dezembro",
];

export default function GeradorPDF({
  funcionario = {},
  fichas = [],
  assinaturaGestor = "",
}) {
  const { isOpen, onOpen, onClose } = useDisclosure();
  const [tipoPDF, setTipoPDF] = useState("");
  const [fichaSelecionada, setFichaSelecionada] = useState("");

  const [linkAssinatura, setLinkAssinatura] = useState("");
  const [gerandoLink, setGerandoLink] = useState(false);

  const [fichasLocal, setFichasLocal] = useState(fichas);
  const [pollingId, setPollingId] = useState(null);

  const toast = useToast();
  const { token: contextToken } = useAuth() || {};
  const apiURL = import.meta.env.VITE_API_BASE_URL;

  const getAuthToken = () =>
    contextToken ||
    getAccessToken() ||
    localStorage.getItem("accessToken") ||
    localStorage.getItem("@folha:token");

  /** Atualiza fichas internas */
  useEffect(() => {
    setFichasLocal(fichas);
  }, [fichas]);

  /** Limpa polling ao desmontar */
  useEffect(() => {
    return () => {
      if (pollingId) clearInterval(pollingId);
    };
  }, [pollingId]);

  /** Utilitário */
  const mesAnoLabel = (f) =>
    `${mesesNomes[f.mesReferencia - 1]} / ${f.anoReferencia}`;

  /** Ficha selecionada */
  const fichaSelecionadaObj = fichasLocal.find(
    (x) => x._id === fichaSelecionada
  );

  const statusFuncionarioAssinou =
    !!fichaSelecionadaObj?.assinaturaFuncionario;

  const statusGestorAssinou =
    typeof assinaturaGestor === "string" &&
    assinaturaGestor.trim() !== "";

  // ==================================================
  // 📌 GERAR LINK DE ASSINATURA DO FUNCIONÁRIO
  // ==================================================
  const handleGerarLinkAssinatura = async () => {
    if (!fichaSelecionada) {
      return toast({
        title: "Selecione uma ficha/mês primeiro",
        status: "warning",
      });
    }

    const authToken = getAuthToken();
    if (!authToken) {
      return toast({
        title: "Token ausente",
        status: "error",
      });
    }

    try {
      setGerandoLink(true);

      const res = await fetch(
        `${apiURL}/fichas/${fichaSelecionada}/gerar-link-assinatura`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${authToken}`,
          },
        }
      );

      const data = await res.json();
      if (!res.ok) throw new Error(data.error);

      const url =
        data.urlAssinatura ||
        `${import.meta.env.VITE_FRONTEND_BASE_URL}/assinar/${data.token}`;

      setLinkAssinatura(url);

      toast({
        title: "Link gerado!",
        status: "success",
      });

      // inicia polling
      if (pollingId) clearInterval(pollingId);

      const id = setInterval(async () => {
        try {
          const resFicha = await fetch(`${apiURL}/fichas/${fichaSelecionada}`, {
            headers: { Authorization: `Bearer ${authToken}` },
          });

          const fichaData = await resFicha.json();
          if (!resFicha.ok) return;

          setFichasLocal((prev) =>
            prev.map((f) =>
              f._id === fichaData._id ? { ...f, ...fichaData } : f
            )
          );

          if (fichaData.assinaturaFuncionario) {
            clearInterval(id);
            setPollingId(null);

            toast({
              title: "Assinatura registrada!",
              status: "success",
            });
          }
        } catch {}
      }, 4000);

      setPollingId(id);
    } catch (err) {
      toast({
        title: "Erro ao gerar link",
        description: err.message,
        status: "error",
      });
    } finally {
      setGerandoLink(false);
    }
  };

  const handleCopiarLink = async () => {
    try {
      await navigator.clipboard.writeText(linkAssinatura);
      toast({ title: "Link copiado!", status: "success" });
    } catch {
      toast({ title: "Erro ao copiar link", status: "error" });
    }
  };

  // ==================================================
  // 📌 GERAR PDF
  // ==================================================
  const gerarPDF = () => {
    try {
      if (!funcionario?.nome)
        return toast({ title: "Selecione um funcionário", status: "warning" });

      if (!fichasLocal.length)
        return toast({ title: "Nenhuma ficha encontrada", status: "warning" });

      const doc = new jsPDF({
        orientation: "portrait",
        unit: "mm",
        format: "a4",
      });

      const dataEmissao = new Date().toLocaleDateString("pt-BR");

      const nomeEmpresa = funcionario.empregadorNome || "Empresa";
      const cnpjEmpresa = funcionario.cnpjOuCei || "CNPJ não informado";

      // -------------------------------------
      // CABEÇALHO
      // -------------------------------------
      const desenharCabecalho = (titulo, f) => {
        const mesAno = mesAnoLabel(f);

        doc.setFillColor(25, 60, 120);
        doc.rect(0, 0, 210, 20, "F");

        doc.setFontSize(14);
        doc.setTextColor(255, 255, 255);
        doc.text(nomeEmpresa.toUpperCase(), 10, 9);

        doc.setFontSize(10);
        doc.text(`CNPJ/CEI: ${cnpjEmpresa}`, 10, 16);

        doc.setFontSize(12);
        doc.text(titulo, 105, 9, { align: "center" });
        doc.text(`Emitido: ${dataEmissao}`, 200, 16, { align: "right" });

        doc.setTextColor(0, 0, 0);
        doc.setFontSize(12);
        doc.text(`Referência: ${mesAno}`, 10, 32);
        doc.line(10, 34, 200, 34);

        const adm = funcionario.dataAdmissao
          ? ` • Admissão: ${new Date(funcionario.dataAdmissao).toLocaleDateString(
              "pt-BR"
            )}`
          : "";

        const funcao = funcionario.funcao
          ? ` • Função: ${funcionario.funcao}`
          : "";

        doc.text(`Funcionário: ${funcionario.nome}${funcao}${adm}`, 10, 42);
      };

      // -------------------------------------
      // RODAPÉ
      // -------------------------------------
      const desenharRodape = () => {
        const pages = doc.internal.getNumberOfPages();
        const h = doc.internal.pageSize.getHeight();
        const w = doc.internal.pageSize.getWidth();

        for (let i = 1; i <= pages; i++) {
          doc.setPage(i);
          doc.setFontSize(9);
          doc.setTextColor(80);
          doc.text("Sistema Folha de Ponto - RH Digital", 10, h - 8);
          doc.text(`Página ${i} de ${pages}`, w - 10, h - 8, {
            align: "right",
          });
        }
      };

      // -------------------------------------
      // TABELA + ASSINATURAS
      // -------------------------------------
      const desenharTabela = (f) => {
        const dias = Array.isArray(f.diasDoMes) ? f.diasDoMes : [];

        autoTable(doc, {
          startY: 50,
          head: [
            ["Dia", "Entrada", "Saída Almoço", "Entrada Almoço", "Saída"],
          ],
          body: dias.map((d, i) => [
            i + 1,
            d.entrada || "-",
            d.saidaAlmoco || "-",
            d.entradaAlmoco || "-",
            d.saida || "-",
          ]),
          theme: "grid",
          styles: {
            fontSize: 7,
            cellPadding: 1.8,
            halign: "center",
          },
          headStyles: {
            fillColor: [25, 60, 120],
            textColor: 255,
            fontStyle: "bold",
          },
          margin: { left: 10, right: 10 },
        });

        const finalY = doc.lastAutoTable.finalY + 10;
        doc.setFontSize(10);

        const isBase64 = (str) =>
          typeof str === "string" &&
          (str.startsWith("data:image/png;base64,") ||
            str.startsWith("data:image/jpeg;base64,"));

        // -------------------------
        // ASSINATURA DO FUNCIONÁRIO
        // -------------------------
        doc.text("Assinatura do Funcionário:", 15, finalY);

        if (isBase64(f.assinaturaFuncionario)) {
          try {
            doc.addImage(f.assinaturaFuncionario, "PNG", 70, finalY - 6, 40, 12);
          } catch {
            doc.text("__________________________", 70, finalY);
          }
        } else {
          doc.text("__________________________", 70, finalY);
        }

        // -------------------------
        // ASSINATURA DO GESTOR
        //-------------------------
        const yGestor = finalY + 18;
        doc.text("Assinatura do Gestor:", 15, yGestor);

        if (isBase64(assinaturaGestor)) {
          try {
            doc.addImage(assinaturaGestor, "PNG", 65, yGestor - 6, 40, 12);
          } catch {
            doc.text("__________________________", 65, yGestor);
          }
        } else {
          doc.text("__________________________", 65, yGestor);
        }
      };

      // -------------------------------------
      // MONTA O PDF
      // -------------------------------------
      if (tipoPDF === "completo") {
        fichasLocal.forEach((f, i) => {
          if (i > 0) doc.addPage();
          desenharCabecalho("FOLHA DE PONTO", f);
          desenharTabela(f);
        });
      } else if (tipoPDF === "resumo") {
        const f = fichasLocal.find((x) => x._id === fichaSelecionada);
        if (!f) {
          return toast({
            title: "Selecione o mês",
            status: "warning",
          });
        }

        desenharCabecalho("FOLHA DE PONTO", f);
        desenharTabela(f);
      } else {
        return toast({
          title: "Escolha o tipo de PDF",
          status: "warning",
        });
      }

      desenharRodape();
      doc.save(`Folha_${funcionario.nome}.pdf`);
      onClose();
    } catch (err) {
      toast({
        title: "Erro ao gerar PDF",
        description: err.message,
        status: "error",
      });
    }
  };

  // ==================================================
  // RENDERIZAÇÃO
  // ==================================================
  return (
    <>
      <Button
        colorScheme="blue"
        onClick={onOpen}
        as={motion.button}
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.97 }}
        leftIcon={<FiFileText />}
      >
        Gerar PDF
      </Button>

      <Modal isOpen={isOpen} onClose={onClose} size="lg" isCentered>
        <ModalOverlay />
        <ModalContent bg="gray.800" color="white">
          <ModalHeader color="blue.300">Folha de Ponto – PDF & Assinatura</ModalHeader>
          <ModalCloseButton />

          <ModalBody>
            <Tabs isFitted variant="enclosed" colorScheme="blue">
              <TabList mb={4}>
                <Tab>Assinatura do Funcionário</Tab>
                <Tab>Gerar PDF</Tab>
              </TabList>

              <TabPanels>
                {/* ---------------- TAB 1 ---------------- */}
                <TabPanel>
                  <VStack align="stretch" spacing={4}>
                    <Text fontSize="sm" color="gray.300">
                      Escolha a ficha/mês para gerar link de assinatura:
                    </Text>

                    {/* Seleção do mês */}
                    <FormControl>
                      <Text color="gray.200">Ficha / Mês</Text>
                      <Select
                        bg="gray.700"
                        value={fichaSelecionada}
                        onChange={(e) => {
                          setFichaSelecionada(e.target.value);
                          setLinkAssinatura("");
                        }}
                      >
                        <option value="" style={{ color: "black" }}>
                          Selecione
                        </option>
                        {fichasLocal.map((f) => (
                          <option key={f._id} value={f._id} style={{ color: "black" }}>
                            {mesAnoLabel(f)}
                          </option>
                        ))}
                      </Select>
                    </FormControl>

                    {/* STATUS DA ASSINATURA FUNCIONÁRIO */}
                    {fichaSelecionada && (
                      <HStack justify="space-between">
                        <Text fontSize="sm">Status Funcionário:</Text>
                        <Badge
                          colorScheme={
                            statusFuncionarioAssinou ? "green" : "yellow"
                          }
                          display="flex"
                          alignItems="center"
                          gap={1}
                        >
                          {statusFuncionarioAssinou ? (
                            <>
                              <FiCheckCircle /> Assinada
                            </>
                          ) : (
                            <>
                              <FiClock /> Pendente
                            </>
                          )}
                        </Badge>
                      </HStack>
                    )}

                    {/* STATUS DA ASSINATURA GESTOR */}
                    <HStack justify="space-between">
                      <Text fontSize="sm">Status Gestor:</Text>
                      <Badge
                        colorScheme={statusGestorAssinou ? "green" : "yellow"}
                        display="flex"
                        alignItems="center"
                        gap={1}
                      >
                        {statusGestorAssinou ? (
                          <>
                            <FiCheckCircle /> Assinada
                          </>
                        ) : (
                          <>
                            <FiClock /> Pendente
                          </>
                        )}
                      </Badge>
                    </HStack>

                    {/* Botão gerar link */}
                    <HStack spacing={3} mt={2}>
                      <Button
                        leftIcon={<FiLink />}
                        colorScheme="blue"
                        onClick={handleGerarLinkAssinatura}
                        isLoading={gerandoLink}
                        isDisabled={!fichaSelecionada}
                      >
                        Gerar link de assinatura
                      </Button>
                    </HStack>

                    {/* Link gerado */}
                    {linkAssinatura && (
                      <VStack align="stretch" mt={3} spacing={2}>
                        <Text fontSize="xs" color="gray.300">
                          Link gerado:
                        </Text>

                        <InputGroup>
                          <Input
                            bg="gray.900"
                            value={linkAssinatura}
                            isReadOnly
                            fontSize="xs"
                          />
                          <InputRightElement>
                            <IconButton
                              aria-label="Copiar"
                              icon={<FiCopy />}
                              size="sm"
                              variant="ghost"
                              onClick={handleCopiarLink}
                            />
                          </InputRightElement>
                        </InputGroup>
                      </VStack>
                    )}
                  </VStack>
                </TabPanel>

                {/* ---------------- TAB 2 ---------------- */}
                <TabPanel>
                  <VStack align="stretch" spacing={4}>
                    <Text>Tipo de PDF:</Text>

                    <Select
                      bg="gray.700"
                      value={tipoPDF}
                      onChange={(e) => setTipoPDF(e.target.value)}
                    >
                      <option value="" style={{ color: "black" }}>
                        Selecione
                      </option>
                      <option value="completo" style={{ color: "black" }}>
                        Completo (todos os meses)
                      </option>
                      <option value="resumo" style={{ color: "black" }}>
                        Resumo (um mês)
                      </option>
                    </Select>

                    {tipoPDF === "resumo" && (
                      <Select
                        bg="gray.700"
                        value={fichaSelecionada}
                        onChange={(e) => setFichaSelecionada(e.target.value)}
                      >
                        <option value="" style={{ color: "black" }}>
                          Selecione o mês
                        </option>
                        {fichasLocal.map((f) => (
                          <option key={f._id} value={f._id} style={{ color: "black" }}>
                            {mesAnoLabel(f)}
                          </option>
                        ))}
                      </Select>
                    )}
                  </VStack>
                </TabPanel>
              </TabPanels>
            </Tabs>
          </ModalBody>

          <ModalFooter>
            <Button mr={3} onClick={onClose} variant="ghost">
              Fechar
            </Button>
            <Button colorScheme="blue" onClick={gerarPDF}>
              Gerar PDF
            </Button>
          </ModalFooter>
        </ModalContent>
      </Modal>
    </>
  );
}
