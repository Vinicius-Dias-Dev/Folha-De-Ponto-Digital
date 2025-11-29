// src/theme.js
import { extendTheme } from "@chakra-ui/react";

const theme = extendTheme({
  colors: {
    gray: {
      900: "#0D1117",
      800: "#161B22",
      700: "#21262D",
      600: "#30363D",
    },
    brand: {
      500: "#3182CE", // Azul primário
      600: "#2563EB",
      700: "#1D4ED8",
    },
  },
  components: {
    Button: {
      baseStyle: {
        fontWeight: "medium",
      },
      sizes: {
        md: {
          borderRadius: "8px",
          _focus: { boxShadow: "0 0 0 2px rgba(49,130,206,0.7)" },
        },
      },
    },
    Input: {
      baseStyle: {
        field: {
          borderRadius: "8px",
        },
      },
    },
    Select: {
      baseStyle: {
        field: {
          borderRadius: "8px",
        },
      },
    },
  },
});

export default theme;
