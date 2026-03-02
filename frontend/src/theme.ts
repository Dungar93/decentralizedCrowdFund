import { extendTheme, type ThemeConfig } from "@chakra-ui/react";

const config: ThemeConfig = {
  initialColorMode: "system",
  useSystemColorMode: true,
};

export const theme = extendTheme({
  config,
  fonts: {
    heading: `'Inter', sans-serif`,
    body: `'Inter', sans-serif`,
  },
  colors: {
    brand: {
      50: "#e6f3ff",
      100: "#b3d4ff",
      500: "#3182ce",
      600: "#2b6cb0",
      700: "#2c5282",
    },
    risk: {
      low: "#48bb78",
      medium: "#ed8936",
      high: "#e53e3e",
    },
  },
});
