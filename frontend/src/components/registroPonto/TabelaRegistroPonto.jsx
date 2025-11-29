// src/components/registroPonto/TabelaRegistroPonto.jsx
import { useEffect, useState } from "react";
import {
  Box,
  Table,
  Thead,
  Tbody,
  Tr,
  Th,
  Td,
  Input,
  Text,
  Select,
  Badge,
  Button,
  HStack,
  useToast,
} from "@chakra-ui/react";
import { FiTrash2 } from "react-icons/fi";

export default function TabelaRegistroPonto({
  fichaSelecionada,
  setFichaSelecionada,
  onExcluirFicha,
}) {
  const [dias, setDias] = useState([]);
  const toast = useToast();

  useEffect(() => {
    if (fichaSelecionada?.diasDoMes?.length) {
      setDias(fichaSelecionada.diasDoMes);
    } else {
      const novosDias = Array.from({ length: 31 }, (_, i) => ({
        data: i + 1,
        entrada: "",
        saidaAlmoco: "",
        entradaAlmoco: "",
        saida: "",
        extraEntrada: "",
        extraSaida: "",
        tipo: "presente",
      }));
      setDias(novosDias);
      setFichaSelecionada((prev) => ({
        ...prev,
        diasDoMes: novosDias,
      }));
    }
  }, [fichaSelecionada, setFichaSelecionada]);

  const atualizarDia = (index, novo) => {
    const novosDias = [...dias];
    novosDias[index] = novo;
    setDias(novosDias);
    setFichaSelecionada((prev) => ({
      ...prev,
      diasDoMes: novosDias,
    }));
  };

  const handleCampo = (index, campo, valor) => {
    const dia = { ...dias[index], [campo]: valor };

    const temHoras =
      dia.entrada || dia.saida || dia.saidaAlmoco || dia.entradaAlmoco;

    if (temHoras && dia.tipo !== "presente") {
      dia.tipo = "presente";
    }
    if (!temHoras && dia.tipo === "presente") {
      dia.tipo = "faltou";
    }

    atualizarDia(index, dia);
  };

  const handleTipo = (index, novoTipo) => {
    const dia = { ...dias[index], tipo: novoTipo };

    if (novoTipo !== "presente") {
      dia.entrada = "";
      dia.saida = "";
      dia.saidaAlmoco = "";
      dia.entradaAlmoco = "";
      dia.extraEntrada = "";
      dia.extraSaida = "";
    }

    atualizarDia(index, dia);
  };

  const badgeTipo = (tipo) => {
    switch (tipo) {
      case "faltou":
        return <Badge colorScheme="red">❌ Falta</Badge>;
      case "abonada":
        return <Badge colorScheme="yellow">⭐ Abonada</Badge>;
      case "atestado":
        return <Badge colorScheme="green">🏥 Atestado</Badge>;
      default:
        return <Badge colorScheme="gray">✅ Presente</Badge>;
    }
  };

  const handleAssinatura = (value) => {
    setFichaSelecionada((prev) => ({
      ...prev,
      assinatura: value,
    }));
  };

  const confirmarExclusao = () => {
    if (!onExcluirFicha) {
      toast({
        title: "Função de exclusão não recebida",
        status: "error",
      });
      return;
    }

    onExcluirFicha(fichaSelecionada._id);
  };

  return (
    <Box
      mt={8}
      p={4}
      bg="gray.800"
      borderWidth="1px"
      borderColor="gray.700"
      rounded="lg"
      overflowX="auto"
    >
      {/* Título + Botão excluir */}
      <HStack justify="space-between" mb={3}>
        <Text fontSize="lg" fontWeight="bold" color="blue.300">
          Registro de Ponto
        </Text>

      </HStack>

      <Table variant="simple" size="sm">
        <Thead bg="gray.700">
          <Tr>
            <Th color="gray.100" textAlign="center">
              Dia
            </Th>
            <Th color="gray.100" textAlign="center">
              Entrada
            </Th>
            <Th color="gray.100" textAlign="center">
              Saída Almoço
            </Th>
            <Th color="gray.100" textAlign="center">
              Entrada Almoço
            </Th>
            <Th color="gray.100" textAlign="center">
              Saída
            </Th>
            <Th color="gray.100" textAlign="center">
              Extra Entrada
            </Th>
            <Th color="gray.100" textAlign="center">
              Extra Saída
            </Th>
            <Th color="gray.100" textAlign="center">
              Tipo
            </Th>
          </Tr>
        </Thead>

        <Tbody>
          {dias.map((dia, index) => (
            <Tr key={index} _hover={{ bg: "gray.700" }}>
              <Td textAlign="center" color="white">
                {dia.data}
              </Td>

              <Td>
                <Input
                  type="time"
                  bg="gray.900"
                  color="white"
                  value={dia.entrada || ""}
                  onChange={(e) =>
                    handleCampo(index, "entrada", e.target.value)
                  }
                />
              </Td>

              <Td>
                <Input
                  type="time"
                  bg="gray.900"
                  color="white"
                  value={dia.saidaAlmoco || ""}
                  onChange={(e) =>
                    handleCampo(index, "saidaAlmoco", e.target.value)
                  }
                />
              </Td>

              <Td>
                <Input
                  type="time"
                  bg="gray.900"
                  color="white"
                  value={dia.entradaAlmoco || ""}
                  onChange={(e) =>
                    handleCampo(index, "entradaAlmoco", e.target.value)
                  }
                />
              </Td>

              <Td>
                <Input
                  type="time"
                  bg="gray.900"
                  color="white"
                  value={dia.saida || ""}
                  onChange={(e) =>
                    handleCampo(index, "saida", e.target.value)
                  }
                />
              </Td>

              <Td>
                <Input
                  type="time"
                  bg="gray.900"
                  color="white"
                  value={dia.extraEntrada || ""}
                  onChange={(e) =>
                    handleCampo(index, "extraEntrada", e.target.value)
                  }
                />
              </Td>

              <Td>
                <Input
                  type="time"
                  bg="gray.900"
                  color="white"
                  value={dia.extraSaida || ""}
                  onChange={(e) =>
                    handleCampo(index, "extraSaida", e.target.value)
                  }
                />
              </Td>

              <Td textAlign="center">
                {badgeTipo(dia.tipo)}
                <Select
                  value={dia.tipo}
                  onChange={(e) => handleTipo(index, e.target.value)}
                  bg="gray.900"
                  color="white"
                  borderColor="gray.600"
                  fontSize="xs"
                  mt={1}
                >
                  <option value="presente" style={{ color: "black" }}>
                    Presente
                  </option>
                  <option value="faltou" style={{ color: "black" }}>
                    ❌ Falta
                  </option>
                  <option value="abonada" style={{ color: "black" }}>
                    ⭐ Abonada
                  </option>
                  <option value="atestado" style={{ color: "black" }}>
                    🏥 Atestado
                  </option>
                </Select>
              </Td>
            </Tr>
          ))}
        </Tbody>
      </Table>

      <Box mt={6}>
        <Text fontWeight="bold" color="gray.200" mb={1}>
          Assinatura:
        </Text>
        <Input
          placeholder="Nome do responsável"
          value={fichaSelecionada?.assinatura || ""}
          onChange={(e) => handleAssinatura(e.target.value)}
          bg="gray.900"
          color="white"
          borderColor="gray.600"
        />
      </Box>
    </Box>
  );
}
