import { Navigate } from "react-router-dom";
import { useAuth } from "../contexts/AuthContext";
import { Spinner, Flex } from "@chakra-ui/react";

export default function GuardedRoute({ children }) {
  const { user, authReady } = useAuth();

  if (!authReady) {
    return (
      <Flex justify="center" align="center" minH="100vh">
        <Spinner size="xl" />
      </Flex>
    );
  }

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  return children;
}
