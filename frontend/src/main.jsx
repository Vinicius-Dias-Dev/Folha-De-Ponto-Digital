import React from "react";
import ReactDOM from "react-dom/client";
import { BrowserRouter } from "react-router-dom";
import { ChakraProvider } from "@chakra-ui/react";

import theme from "./theme.js";

import App from "./App.jsx";
import { AuthProvider } from "../src/contexts/AuthContext.jsx";

ReactDOM.createRoot(document.getElementById("root")).render(
  <React.StrictMode>
    <BrowserRouter>
      <AuthProvider>
     <ChakraProvider theme={theme}>
      <App />
    </ChakraProvider>
      </AuthProvider>
    </BrowserRouter>
  </React.StrictMode>
);
