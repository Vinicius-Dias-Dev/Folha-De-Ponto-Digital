import { useState } from "react";
import {
  Box,
  Flex,
  Heading,
  Input,
  Button,
  VStack,
  useToast,
  Text,
  FormControl,
  InputGroup,
  InputRightElement,
  IconButton,
} from "@chakra-ui/react";
import { ViewIcon, ViewOffIcon } from "@chakra-ui/icons";
import { motion } from "framer-motion";
import { useAuth } from "../contexts/AuthContext";
import { useNavigate } from "react-router-dom";

export default function Login() {
  const { login } = useAuth();
  const navigate = useNavigate();
  const toast = useToast();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPass, setShowPass] = useState(false);
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e) {
    e.preventDefault();

    if (!email || !password) {
      toast({ title: "Preencha e-mail e senha", status: "warning" });
      return;
    }

    setLoading(true);

    try {
      await login(email, password);

      toast({ title: "Bem-vindo!", status: "success" });

      navigate("/sistema", { replace: true });

    } catch {
      toast({
        title: "Credenciais inválidas",
        status: "error",
      });
    } finally {
      setLoading(false);
    }
  }

  return (
    <Flex
      minH="100vh"
      align="center"
      justify="center"
      bg="linear-gradient(135deg, #0D1117, #1e293b)"
      p={4}
    >
      <Box
        as={motion.div}
        initial={{ opacity: 0, y: 25 }}
        animate={{ opacity: 1, y: 0 }}
        transition="0.4s"
        bg="rgba(255, 255, 255, 0.04)"
        border="1px solid rgba(255,255,255,0.08)"
        backdropFilter="blur(12px)"
        rounded="2xl"
        p={10}
        w="100%"
        maxW="420px"
        color="white"
        shadow="2xl"
      >
        <Flex direction="column" align="center" mb={6}>
          <Heading size="lg" fontWeight="bold">
            Folha de Ponto Digital
          </Heading>
          <Text fontSize="sm" color="gray.300" mt={2}>
            Sistema de controle e gestão de jornada ⚙️
          </Text>
        </Flex>

        <VStack spacing={4} as="form" onSubmit={handleSubmit}>
          <FormControl>
            <Input
              placeholder="E-mail"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              bg="gray.900"
              borderColor="gray.700"
              p={6}
              rounded="lg"
            />
          </FormControl>

          <FormControl>
            <InputGroup>
              <Input
                placeholder="Senha"
                type={showPass ? "text" : "password"}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                bg="gray.900"
                borderColor="gray.700"
                p={6}
                rounded="lg"
              />
              <InputRightElement pe={2}>
                <IconButton
                  variant="ghost"
                  icon={showPass ? <ViewOffIcon /> : <ViewIcon />}
                  size="sm"
                  onClick={() => setShowPass(!showPass)}
                />
              </InputRightElement>
            </InputGroup>
          </FormControl>

          <Button
            width="100%"
            colorScheme="blue"
            type="submit"
            isLoading={loading}
            loadingText="Entrando..."
            py={6}
            rounded="lg"
            as={motion.button}
          >
            Acessar Sistema
          </Button>
        </VStack>

        <Text fontSize="xs" color="gray.400" textAlign="center" mt={6}>
          © {new Date().getFullYear()}Vinicius Dias. Todos os direitos reservados.
        </Text>
      </Box>
    </Flex>
  );
}
