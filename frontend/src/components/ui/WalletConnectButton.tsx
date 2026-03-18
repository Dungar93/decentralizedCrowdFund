import { useState } from "react";

declare global {
  interface Window {
    ethereum?: any;
  }
}

export default function WalletConnectButton() {
  const [connecting, setConnecting] = useState(false);

  const handleConnect = async () => {
    setConnecting(true);
    try {
      // Check if MetaMask is installed
      if (!window.ethereum) {
        alert("Please install MetaMask to connect your wallet");
        setConnecting(false);
        return;
      }

      // Request account access
      const accounts = await window.ethereum.request({
        method: "eth_requestAccounts",
      });

      if (accounts.length > 0) {
        // Store wallet address in localStorage
        localStorage.setItem("walletAddress", accounts[0]);
        alert("Wallet connected successfully!");
      }
    } catch (err: any) {
      alert(`Connection failed: ${err.message}`);
    } finally {
      setConnecting(false);
    }
  };

  return (
    <button
      onClick={handleConnect}
      disabled={connecting}
      className="px-4 py-2 bg-white text-purple-600 font-semibold rounded-lg hover:bg-purple-100 transition disabled:opacity-70 disabled:cursor-not-allowed"
    >
      {connecting ? "Connecting..." : "🔗 Wallet"}
    </button>
  );
}
