// src/components/layout/LayoutDashboard.jsx
import {
  Box,
  Flex,
  IconButton,
  Text,
  VStack,
  Button,
  Divider,
} from "@chakra-ui/react";
import {
  FiMenu,
  FiHome,
  FiUsers,
  FiCalendar,
  FiClipboard,
  FiLogOut,
} from "react-icons/fi";
import { useAuth } from "../../contexts/AuthContext";
import { useState } from "react";

export default function LayoutDashboard({ children, onChangeTab, currentTab }) {
  const { logout } = useAuth();
  const [open, setOpen] = useState(true);

  const menuItems = [
    { key: "criar", label: "Novo Funcionário", icon: FiUsers },
    { key: "pontos", label: "Pontos", icon: FiCalendar },
    { key: "resumo", label: "Resumo Geral", icon: FiClipboard },
    { key: "informacoes", label: "Funcionários", icon: FiHome },
  ];

  return (
    <Flex minH="100vh" bg="gray.900">
      {/* Sidebar */}
      <Box
        bg="gray.850"
        color="gray.200"
        w={open ? "240px" : "80px"}
        px={4}
        py={6}
        transition="0.3s"
        borderRight="1px solid"
        borderColor="gray.700"
      >
        {/* Botão hamburguer */}
        <IconButton
          icon={<FiMenu />}
          variant="ghost"
          size="md"
          onClick={() => setOpen(!open)}
          mb={6}
          color="gray.200"
          _hover={{ bg: "gray.700" }}
        />

        {/* Menu */}
        <VStack align="stretch" spacing={1}>
          {menuItems.map((item) => {
            const Icon = item.icon;
            const active = currentTab === item.key;
            return (
              <Button
                key={item.key}
                leftIcon={open ? <Icon /> : null}
                justifyContent={open ? "flex-start" : "center"}
                py={6}
                variant={active ? "solid" : "ghost"}
                color={active ? "white" : "gray.300"}
                bg={active ? "blue.600" : "transparent"}
                borderRadius="md"
                transition="0.2s"
                _hover={{
                  bg: active ? "blue.700" : "gray.700",
                  color: "white",
                }}
                onClick={() => onChangeTab(item.key)}
              >
                {!open ? <Icon /> : item.label}
              </Button>
            );
          })}

          <Divider borderColor="gray.700" my={4} />

          {/* Logout */}
          <Button
            leftIcon={open ? <FiLogOut /> : null}
            justifyContent={open ? "flex-start" : "center"}
            variant="ghost"
            fontWeight="bold"
            color="red.400"
            transition="0.2s"
            _hover={{ bg: "red.900", color: "red.300" }}
            onClick={logout}
          >
            {!open ? <FiLogOut /> : "Sair"}
          </Button>
        </VStack>
      </Box>

      {/* Conteúdo principal */}
      <Flex flex="1" justify="center" overflowY="auto" p={6}>
        <Box w="100%" maxW="1100px">
          {/* Cabeçalho fixo */}
          <Box
            position="sticky"
            top={0}
            bg="gray.900"
            p={4}
            mb={6}
            borderBottom="1px solid"
            borderColor="gray.700"
            zIndex={5}
          >
            <Text fontSize="2xl" fontWeight="bold" color="white">
              {currentTab === "criar" && "Cadastrar Funcionário"}
              {currentTab === "pontos" && "Registro de Pontos"}
              {currentTab === "resumo" && "Resumo Geral"}
              {currentTab === "informacoes" && "Funcionários"}
            </Text>
          </Box>

          {/* Card conteúdo */}
          <Box
            bg="gray.800"
            p={{ base: 4, md: 8 }}
            rounded="lg"
            shadow="lg"
            border="1px solid"
            borderColor="gray.700"
            backdropFilter="blur(4px)"
          >
            {children}
          </Box>
        </Box>
      </Flex>
    </Flex>
  );
}
