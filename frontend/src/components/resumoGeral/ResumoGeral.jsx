// src/components/resumoGeral/ResumoGeral.jsx
import { useEffect, useState } from "react";
import {
  Box,
  Text,
  HStack,
  Input,
  Divider,
  Table,
  Thead,
  Tbody,
  Tr,
  Th,
  Td,
  Button,
  useToast,
  IconButton,
  Modal,
  ModalOverlay,
  ModalContent,
  ModalHeader,
  ModalCloseButton,
  ModalBody,
  ModalFooter,
  Badge,
  Select,
} from "@chakra-ui/react";
import { FiSearch } from "react-icons/fi";
import { atualizarFicha } from "../../services/fichaService";

export default function ResumoGeral({ fichaSelecionada, setFichaSelecionada }) {
  const toast = useToast();

  const [resumo, setResumo] = useState({
    diasHorasNormais: "",
    horasExtras: "",
    faltas: [],
    baseCalculo: "",
    inss: "",
    salarioFamilia: "",
    liquido: "",
  });

  const [faltasModalOpen, setFaltasModalOpen] = useState(false);

  // 🔁 Sincroniza automaticamente com a tabela de ponto
  useEffect(() => {
    if (!fichaSelecionada) return;

    const dias = Array.isArray(fichaSelecionada.diasDoMes)
      ? fichaSelecionada.diasDoMes
      : [];

    const resumoSalvo = fichaSelecionada.resumoGeral || {};

    let totalHoras = 0;
    let diasTrabalhados = 0;
    let faltasArray = [];
    let horasExtras = 0;

    for (const d of dias) {
      // Trabalhados
      if (d?.entrada && d?.saida) {
        diasTrabalhados++;
        const e = new Date(`2020-01-01T${d.entrada}:00`);
        const s = new Date(`2020-01-01T${d.saida}:00`);
        totalHoras += (s - e) / 3600000;
      }

      // Faltas (somente dias com tipo diferente de presente)
      if (d?.tipo && d.tipo !== "presente") {
        faltasArray.push({ dia: d.data, tipo: d.tipo, obs: d.obs || "" });
      }

      // Extras
      if (d?.extraEntrada && d?.extraSaida) {
        const e1 = new Date(`2020-01-01T${d.extraEntrada}:00`);
        const e2 = new Date(`2020-01-01T${d.extraSaida}:00`);
        horasExtras += (e2 - e1) / 3600000;
      }
    }

    setResumo({
      diasHorasNormais: `${diasTrabalhados} dias — ${totalHoras.toFixed(1)}h`,
      horasExtras: `${horasExtras.toFixed(1)}h`,
      faltas: faltasArray,
      baseCalculo: resumoSalvo.baseCalculo || "",
      inss: resumoSalvo.inss || "",
      salarioFamilia: resumoSalvo.salarioFamilia || "",
      liquido: resumoSalvo.liquido || "",
    });
  }, [fichaSelecionada, fichaSelecionada?.diasDoMes]);

  // 🔧 Atualiza o tipo/obs direto da ficha
  const atualizarFaltasNoState = (idx, field, value) => {
    const novasFaltas = [...resumo.faltas];
    novasFaltas[idx][field] = value;

    // Atualiza o dia correspondente na ficha
    const novosDias = [...fichaSelecionada.diasDoMes];
    const diaRef = novasFaltas[idx].dia - 1;
    if (novosDias[diaRef]) novosDias[diaRef][field] = value;

    setResumo((prev) => ({ ...prev, faltas: novasFaltas }));
    setFichaSelecionada((prev) => ({
      ...prev,
      diasDoMes: novosDias,
    }));
  };

  // 💾 Salvar resumo geral
  const handleSalvarResumo = async () => {
    try {
      const payload = {
        ...fichaSelecionada,
        resumoGeral: {
          diasHorasNormais: resumo.diasHorasNormais,
          horasExtras: resumo.horasExtras,
          faltas: resumo.faltas, // ✅ agora é array, igual ao model
          baseCalculo: resumo.baseCalculo,
          inss: resumo.inss,
          salarioFamilia: resumo.salarioFamilia,
          liquido: resumo.liquido,
        },
      };

      const atualizada = await atualizarFicha(fichaSelecionada._id, payload);
      setFichaSelecionada(atualizada);

      toast({
        title: "Resumo geral salvo com sucesso!",
        status: "success",
        duration: 3000,
        isClosable: true,
      });
    } catch (err) {
      toast({
        title: "Erro ao salvar resumo",
        description: err?.message || "Tente novamente.",
        status: "error",
        duration: 4000,
        isClosable: true,
      });
    }
  };

  const faltasResumoCurto =
    resumo.faltas.length > 0 ? `${resumo.faltas.length} dias` : "0 dias";

  return (
    <Box
      mt={8}
      p={5}
      bg="gray.800"
      borderWidth="1px"
      borderColor="gray.700"
      rounded="lg"
      color="white"
      shadow="xl"
    >
      <Text fontSize="lg" fontWeight="bold" color="blue.300" mb={3}>
        Resumo Geral
      </Text>

      <Table variant="simple" size="sm">
        <Thead bg="gray.700">
          <Tr>
            <Th color="gray.100">Descrição</Th>
            <Th color="gray.100">Valor</Th>
          </Tr>
        </Thead>

        <Tbody>
          <Tr>
            <Td>Dias / Horas Normais</Td>
            <Td>{resumo.diasHorasNormais || "0 dias — 0h"}</Td>
          </Tr>

          <Tr>
            <Td>Horas Extras / Adicionais</Td>
            <Td>{resumo.horasExtras || "0h"}</Td>
          </Tr>

          <Tr>
            <Td>Faltas no Mês</Td>
            <Td>
              <HStack spacing={3}>
                <Text>{faltasResumoCurto}</Text>
                <IconButton
                  aria-label="Ver detalhes de faltas"
                  icon={<FiSearch />}
                  size="xs"
                  variant="ghost"
                  colorScheme="blue"
                  onClick={() => setFaltasModalOpen(true)}
                />
              </HStack>
            </Td>
          </Tr>

          <Tr>
            <Td>Base de Cálculo</Td>
            <Td>
              <Input
                placeholder="Ex: 2200,00"
                value={resumo.baseCalculo}
                onChange={(e) =>
                  setResumo((prev) => ({ ...prev, baseCalculo: e.target.value }))
                }
                bg="gray.900"
                color="white"
                borderColor="gray.600"
              />
            </Td>
          </Tr>

          <Tr>
            <Td>% INSS / Descontos</Td>
            <Td>
              <Input
                placeholder="Ex: 8%"
                value={resumo.inss}
                onChange={(e) =>
                  setResumo((prev) => ({ ...prev, inss: e.target.value }))
                }
                bg="gray.900"
                color="white"
                borderColor="gray.600"
              />
            </Td>
          </Tr>

          <Tr>
            <Td>Salário Família</Td>
            <Td>
              <Input
                placeholder="Ex: 150,00"
                value={resumo.salarioFamilia}
                onChange={(e) =>
                  setResumo((prev) => ({
                    ...prev,
                    salarioFamilia: e.target.value,
                  }))
                }
                bg="gray.900"
                color="white"
                borderColor="gray.600"
              />
            </Td>
          </Tr>

          <Tr>
            <Td>Total Líquido</Td>
            <Td>
              <Input
                placeholder="Ex: 2400,00"
                value={resumo.liquido}
                onChange={(e) =>
                  setResumo((prev) => ({ ...prev, liquido: e.target.value }))
                }
                bg="gray.900"
                color="white"
                borderColor="gray.600"
              />
            </Td>
          </Tr>
        </Tbody>
      </Table>

      <Divider my={4} />

      <HStack justify="flex-end">
        <Button colorScheme="blue" onClick={handleSalvarResumo}>
          Salvar Resumo
        </Button>
      </HStack>

      {/* MODAL */}
      <Modal
        isOpen={faltasModalOpen}
        onClose={() => setFaltasModalOpen(false)}
        size="lg"
      >
        <ModalOverlay backdropFilter="blur(3px)" />
        <ModalContent
          bg="gray.900"
          border="1px solid"
          borderColor="gray.700"
          rounded="2xl"
        >
          <ModalHeader color="white">Editar Faltas</ModalHeader>
          <ModalCloseButton />

          <ModalBody>
            {resumo.faltas.length === 0 ? (
              <Text color="gray.400">Nenhuma falta registrada.</Text>
            ) : (
              resumo.faltas.map((f, idx) => {
                const badge =
                  f.tipo === "abonada"
                    ? { colorScheme: "yellow", text: "Abonada ⭐" }
                    : f.tipo === "atestado"
                    ? { colorScheme: "green", text: "Atestado 🏥" }
                    : { colorScheme: "red", text: "Falta ❌" };

                return (
                  <Box
                    key={`${f.dia}-${idx}`}
                    bg="gray.800"
                    p={3}
                    mb={3}
                    rounded="lg"
                    border="1px solid"
                    borderColor="gray.700"
                  >
                    <HStack justify="space-between" mb={2}>
                      <Text fontWeight="bold" color="gray.200">
                        Dia {String(f.dia).padStart(2, "0")}
                      </Text>

                      <Badge
                        colorScheme={badge.colorScheme}
                        rounded="full"
                        px={2}
                        py={1}
                      >
                        {badge.text}
                      </Badge>
                    </HStack>

                    <Select
                      value={f.tipo}
                      onChange={(e) =>
                        atualizarFaltasNoState(idx, "tipo", e.target.value)
                      }
                      bg="gray.900"
                      color="white"
                      borderColor="gray.600"
                      mt={2}
                      _hover={{ borderColor: "blue.400" }}
                      _focus={{
                        borderColor: "blue.400",
                        boxShadow: "0 0 0 1px #3182ce",
                      }}
                    >
                      <option
                        style={{ background: "#1A202C", color: "#fff" }}
                        value="faltou"
                      >
                        Falta Injustificada ❌
                      </option>
                      <option
                        style={{ background: "#1A202C", color: "#fff" }}
                        value="abonada"
                      >
                        Abonada ⭐
                      </option>
                      <option
                        style={{ background: "#1A202C", color: "#fff" }}
                        value="atestado"
                      >
                        Atestado 🏥
                      </option>
                    </Select>

                    <Input
                      placeholder="Observação (opcional)"
                      value={f.obs}
                      onChange={(e) =>
                        atualizarFaltasNoState(idx, "obs", e.target.value)
                      }
                      bg="gray.900"
                      color="white"
                      borderColor="gray.600"
                      mt={2}
                    />
                  </Box>
                );
              })
            )}

            <Divider my={3} />
            <Text fontSize="sm" color = "white">
              ❌ Falta injustificada desconta <br />
              ⭐ Abonada não desconta <br />
              🏥 Atestado não desconta
            </Text>
          </ModalBody>

          <ModalFooter>
            <Button onClick={() => setFaltasModalOpen(false)}>Fechar</Button>
            <Button ml={3} colorScheme="blue" onClick={handleSalvarResumo}>
              Salvar Alterações
            </Button>
          </ModalFooter>
        </ModalContent>
      </Modal>
    </Box>
  );
}
