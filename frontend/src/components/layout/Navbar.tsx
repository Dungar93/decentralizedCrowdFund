import {
  Box,
  Flex,
  Heading,
  Button,
  useColorMode,
  Spacer,
  HStack,
} from "@chakra-ui/react";
import { Link as RouterLink } from "react-router-dom";
import { MoonIcon, SunIcon } from "@chakra-ui/icons";
import WalletConnectButton from "../ui/WalletConnectButton";

export default function Navbar() {
  const { colorMode, toggleColorMode } = useColorMode();
  const isAuthenticated = !!localStorage.getItem("token");

  return (
    <Box as="nav" bg="brand.700" color="white" px={6} py={4} shadow="md">
      <Flex align="center" maxW="container.xl" mx="auto">
        <Heading size="lg" as={RouterLink} to="/">
          MedTrustFund
        </Heading>

        <Spacer />

        <HStack spacing={6}>
          <Button
            variant="ghost"
            onClick={toggleColorMode}
            aria-label="Toggle theme"
          >
            {colorMode === "light" ? <MoonIcon /> : <SunIcon />}
          </Button>

          {isAuthenticated ? (
            <>
              <Button as={RouterLink} to="/dashboard" variant="ghost">
                Dashboard
              </Button>
              <Button as={RouterLink} to="/create" colorScheme="brand">
                Create Campaign
              </Button>
              <Button
                as={RouterLink}
                to="/hospital"
                variant="outline"
                colorScheme="whiteAlpha"
              >
                Hospital Portal
              </Button>
            </>
          ) : (
            <Button
              as={RouterLink}
              to="/login"
              variant="outline"
              colorScheme="whiteAlpha"
            >
              Login
            </Button>
          )}

          <WalletConnectButton />
        </HStack>
      </Flex>
    </Box>
  );
}
