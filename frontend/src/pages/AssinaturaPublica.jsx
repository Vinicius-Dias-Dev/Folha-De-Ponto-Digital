import { useEffect, useRef, useState } from "react";
import {
  Box,
  Button,
  Center,
  Spinner,
  Text,
  VStack,
  HStack,
  useToast,
  Heading,
  Divider,
  Badge,
} from "@chakra-ui/react";
import { useParams } from "react-router-dom";
import SignatureCanvas from "react-signature-canvas";
import { FiCheck, FiTrash2 } from "react-icons/fi";

const apiURL = import.meta.env.VITE_API_BASE_URL;

export default function AssinaturaPublica() {
  const { token } = useParams();
  const toast = useToast();

  const [loading, setLoading] = useState(true);
  const [ficha, setFicha] = useState(null);
  const [erro, setErro] = useState("");
  const [salvando, setSalvando] = useState(false);
  const [jaAssinada, setJaAssinada] = useState(false);

  const sigRef = useRef(null);

  // Carrega dados da ficha pelo token
  useEffect(() => {
    async function carregar() {
      try {
        setLoading(true);
        const res = await fetch(`${apiURL}/fichas/por-token/${token}`);
        const data = await res.json();

        if (!res.ok) {
          throw new Error(data.error || "Token inválido ou expirado.");
        }

        setFicha(data);
        setJaAssinada(!!data.jaAssinada);
      } catch (e) {
        setErro(e.message);
      } finally {
        setLoading(false);
      }
    }

    carregar();
  }, [token]);

  const limparAssinatura = () => {
    sigRef.current?.clear();
  };

const handleConfirmar = async () => {
  if (!sigRef.current || sigRef.current.isEmpty()) {
    return toast({
      title: "Desenhe sua assinatura",
      description: "O campo de assinatura está vazio.",
      status: "warning",
      duration: 3000,
    });
  }

  try {
    setSalvando(true);

    // ✅ PEGAR CANVAS NORMAL — SEM getTrimmedCanvas()
    const assinaturaBase64 = sigRef.current.getCanvas().toDataURL("image/png");

    const res = await fetch(`${apiURL}/fichas/assinar/${token}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ assinaturaBase64 }),
    });

    const data = await res.json();

    if (!res.ok) throw new Error(data.error || "Erro ao salvar assinatura.");

    setJaAssinada(true);

    toast({
      title: "Assinatura registrada!",
      status: "success",
    });
  } catch (e) {
    console.error("Erro ao assinar ficha:", e);
    toast({
      title: "Erro ao registrar assinatura",
      description: e.message,
      status: "error",
    });
  } finally {
    setSalvando(false);
  }
};


  // Estados de carregamento/erro
  if (loading) {
    return (
      <Center h="100vh" bg="#0f141b">
        <VStack spacing={4}>
          <Spinner size="xl" color="blue.400" />
          <Text color="gray.300">Carregando folha para assinatura...</Text>
        </VStack>
      </Center>
    );
  }

  if (erro || !ficha) {
    return (
      <Center h="100vh" bg="#0f141b">
        <VStack spacing={4}>
          <Text fontSize="lg" color="red.300" fontWeight="bold">
            Não foi possível carregar a folha.
          </Text>
          <Text color="gray.300">{erro || "Token inválido ou expirado."}</Text>
        </VStack>
      </Center>
    );
  }

  const { funcionario, header, mesReferencia, anoReferencia } = ficha;

  return (
    <Center minH="100vh" bg="#0f141b" p={4}>
      <Box
        w="100%"
        maxW="600px"
        bg="#161b22"
        borderRadius="lg"
        border="1px solid"
        borderColor="gray.700"
        p={6}
        boxShadow="xl"
      >
        <VStack align="stretch" spacing={4}>
          <Heading size="md" color="blue.300" textAlign="center">
            Assinatura da Folha de Ponto
          </Heading>

          <Text fontSize="sm" color="gray.300" textAlign="center">
            Confira seus dados e assine digitalmente para confirmar esta folha.
          </Text>

          <Divider borderColor="gray.700" />

          {/* Dados do funcionário / referência */}
          <Box fontSize="sm" color="gray.200">
            <Text>
              <strong>Funcionário:</strong> {funcionario?.nome}
            </Text>
            {header?.funcao && (
              <Text>
                <strong>Função:</strong> {header.funcao}
              </Text>
            )}
            <Text mt={2}>
              <strong>Referência:</strong> {mesReferencia}/{anoReferencia}
            </Text>

            <Text mt={1}>
              <strong>Empresa:</strong>{" "}
              {header?.empregadorNome || "Não informado"}
            </Text>
          </Box>

          <HStack justify="space-between" align="center">
            <Text fontSize="sm" color="gray.400">
              Status da folha:
            </Text>
            <Badge
              colorScheme={jaAssinada ? "green" : "yellow"}
              variant="subtle"
            >
              {jaAssinada ? "Já assinada" : "Pendente de assinatura"}
            </Badge>
          </HStack>

          <Divider borderColor="gray.700" />

          {/* Área da assinatura */}
          <Box>
            <Text mb={2} color="gray.200">
              Assine no quadro abaixo:
            </Text>

            <Box
              border="1px solid"
              borderColor="gray.600"
              bg="white"
              borderRadius="md"
              overflow="hidden"
            >
              <SignatureCanvas
                ref={sigRef}
                penColor="black"
                canvasProps={{
                  width: 520,
                  height: 200,
                  style: { width: "100%", height: "200px" },
                }}
              />
            </Box>

            <HStack justify="space-between" mt={3}>
              <Button
                leftIcon={<FiTrash2 />}
                variant="ghost"
                size="sm"
                colorScheme="red"
                onClick={limparAssinatura}
              >
                Limpar
              </Button>

              <Button
                leftIcon={<FiCheck />}
                colorScheme="blue"
                onClick={handleConfirmar}
                isLoading={salvando}
              >
                Confirmar assinatura
              </Button>
            </HStack>
          </Box>

          <Text fontSize="xs" color="gray.500" textAlign="center" mt={2}>
            Ao confirmar, sua assinatura será registrada digitalmente nesta
            folha de ponto.
          </Text>
        </VStack>
      </Box>
    </Center>
  );
}
