import { useState, useEffect } from "react";
import { connectWallet, getCurrentWallet, onAccountChanged, removeListeners } from "../../utils/web3";

interface WalletConnectButtonProps {
  onConnect?: (address: string) => void;
  compact?: boolean;
}

export default function WalletConnectButton({ onConnect, compact = false }: WalletConnectButtonProps) {
  const [walletAddress, setWalletAddress] = useState<string>("");
  const [connecting, setConnecting] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    // Check if wallet was previously connected
    const savedWallet = localStorage.getItem("walletAddress");
    if (savedWallet) {
      setWalletAddress(savedWallet);
    }

    // Check current wallet on mount
    checkCurrentWallet();

    // Listen for account changes
    onAccountChanged((accounts: string[]) => {
      if (accounts.length > 0) {
        setWalletAddress(accounts[0]);
        localStorage.setItem("walletAddress", accounts[0]);
        onConnect?.(accounts[0]);
      } else {
        setWalletAddress("");
        localStorage.removeItem("walletAddress");
      }
    });

    return () => {
      removeListeners();
    };
  }, []);

  const checkCurrentWallet = async () => {
    try {
      const wallet = await getCurrentWallet();
      if (wallet) {
        setWalletAddress(wallet);
        localStorage.setItem("walletAddress", wallet);
      }
    } catch (err) {
      console.error("Error checking current wallet:", err);
    }
  };

  const handleConnect = async () => {
    setConnecting(true);
    setError("");

    try {
      const address = await connectWallet();
      setWalletAddress(address);
      localStorage.setItem("walletAddress", address);
      onConnect?.(address);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setConnecting(false);
    }
  };

  const handleDisconnect = () => {
    setWalletAddress("");
    localStorage.removeItem("walletAddress");
    setError("");
  };

  const truncateAddress = (address: string) => {
    return `${address.slice(0, 6)}...${address.slice(-4)}`;
  };

  const copyToClipboard = async () => {
    try {
      await navigator.clipboard.writeText(walletAddress);
      alert("Address copied to clipboard!");
    } catch (err) {
      console.error("Failed to copy:", err);
    }
  };

  if (walletAddress) {
    return (
      <div className="flex items-center gap-2">
        <div className="flex items-center gap-2 px-3 py-2 bg-green-50 border border-green-200 rounded-lg">
          <span className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></span>
          <span className="text-sm font-mono text-green-800 cursor-pointer hover:text-green-900"
            onClick={copyToClipboard}
            title={walletAddress}
          >
            {truncateAddress(walletAddress)}
          </span>
        </div>
        <button
          onClick={handleDisconnect}
          className="px-3 py-2 text-sm text-red-600 hover:bg-red-50 rounded-lg transition"
        >
          Disconnect
        </button>
      </div>
    );
  }

  if (compact) {
    return (
      <button
        onClick={handleConnect}
        disabled={connecting}
        className="px-3 py-1.5 bg-gradient-to-r from-purple-600 to-purple-900 text-white text-sm font-medium rounded-lg hover:shadow-md transition disabled:opacity-50"
      >
        {connecting ? "Connecting..." : "🔗 Connect"}
      </button>
    );
  }

  return (
    <div className="w-full">
      <button
        onClick={handleConnect}
        disabled={connecting}
        className="w-full px-4 py-3 bg-gradient-to-r from-purple-600 to-purple-900 text-white font-semibold rounded-lg hover:shadow-lg transition disabled:opacity-50 disabled:cursor-not-allowed"
      >
        {connecting ? (
          <span className="flex items-center justify-center gap-2">
            <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></span>
            Connecting...
          </span>
        ) : (
          "🔗 Connect Wallet"
        )}
      </button>
      {error && (
        <p className="mt-2 text-sm text-red-600 text-center">{error}</p>
      )}
      {!window.ethereum && (
        <div className="mt-3 text-center">
          <p className="text-xs text-red-400 mb-2">
            MetaMask not installed.
          </p>
          <button
            onClick={() => {
              const mockAddress = "0x" + Array.from({length: 40}, () => Math.floor(Math.random()*16).toString(16)).join('');
              setWalletAddress(mockAddress);
              localStorage.setItem("walletAddress", mockAddress);
              onConnect?.(mockAddress);
            }}
            className="px-4 py-2 bg-slate-800 border border-slate-700 text-slate-300 text-xs rounded-lg hover:bg-slate-700 transition w-full"
          >
            🧪 Mock Connect (Testing Mode)
          </button>
        </div>
      )}
    </div>
  );
}
