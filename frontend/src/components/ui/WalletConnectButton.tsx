import { Button, useToast } from "@chakra-ui/react";
import { useState } from "react";
import { connectWallet } from "@/services/contract";

export default function WalletConnectButton() {
  const [connecting, setConnecting] = useState(false);
  const toast = useToast();

  const handleConnect = async () => {
    setConnecting(true);
    try {
      await connectWallet();
      toast({
        title: "Wallet connected",
        status: "success",
        duration: 4000,
      });
    } catch (err: any) {
      toast({
        title: "Connection failed",
        description: err.message,
        status: "error",
      });
    } finally {
      setConnecting(false);
    }
  };

  return (
    <Button
      colorScheme="purple"
      isLoading={connecting}
      onClick={handleConnect}
      variant="solid"
    >
      Connect Wallet
    </Button>
  );
}
