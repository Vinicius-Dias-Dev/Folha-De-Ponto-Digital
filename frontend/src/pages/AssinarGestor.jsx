// src/pages/AssinarGestor.jsx
import { useState, useRef, useEffect } from "react";
import {
  Box,
  Button,
  Text,
  useToast,
  Spinner,
  Center,
} from "@chakra-ui/react";
import { useParams } from "react-router-dom";
import SignatureCanvas from "react-signature-canvas";

export default function AssinarGestor() {
  const { codigo } = useParams();
  const apiURL = import.meta.env.VITE_API_BASE_URL;
  const toast = useToast();

  const sigRef = useRef(null);
  const [loading, setLoading] = useState(false);
  const [enviado, setEnviado] = useState(false);

  const enviar = async () => {
    if (!sigRef.current || sigRef.current.isEmpty()) {
      toast({ title: "Assine antes de enviar", status: "warning" });
      return;
    }

    setLoading(true);
    try {
      const base64 = sigRef.current.getCanvas().toDataURL("image/png");

      const res = await fetch(`${apiURL}/config/assinatura-gestor/salvar`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ codigo, assinaturaBase64: base64 }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error);

      toast({ title: "Assinatura enviada!", status: "success" });
      setEnviado(true);
    } catch (err) {
      toast({ title: "Erro", description: err.message, status: "error" });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Center minH="100vh" bg="#0f141b" color="white" p={6}>
      <Box bg="#1a202c" p={6} rounded="lg" w="100%" maxW="500px">
        <Text fontSize="xl" mb={4} fontWeight="bold">
          Assinatura do Gestor
        </Text>

        <Box bg="white" rounded="md" border="2px solid #444" mb={4}>
          <SignatureCanvas
            ref={sigRef}
            penColor="black"
            canvasProps={{ width: 450, height: 200 }}
          />
        </Box>

        <Button
          width="100%"
          colorScheme="red"
          mb={4}
          onClick={() => sigRef.current.clear()}
          disabled={enviado}
        >
          Limpar
        </Button>

        <Button
          width="100%"
          colorScheme="green"
          onClick={enviar}
          isLoading={loading}
          disabled={enviado}
        >
          Enviar Assinatura
        </Button>

        {enviado && (
          <Text mt={4} textAlign="center" color="green.300">
            ✔ Assinatura registrada com sucesso.
          </Text>
        )}
      </Box>
    </Center>
  );
}
