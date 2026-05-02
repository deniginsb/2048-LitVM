import { createContext, useContext, useState, useEffect, useCallback, type ReactNode } from "react";
import { createWalletClient, custom, type Address } from "viem";

type EthProvider = {
  request: (args: { method: string; params?: unknown[] }) => Promise<unknown>;
  on: (event: string, handler: (...args: unknown[]) => void) => void;
  removeListener: (event: string, handler: (...args: unknown[]) => void) => void;
};

function getEth(): EthProvider | undefined {
  return (window as unknown as { ethereum?: EthProvider }).ethereum;
}

type WalletContextType = {
  address: Address | null;
  connected: boolean;
  connect: () => Promise<void>;
  disconnect: () => void;
  walletClient: ReturnType<typeof createWalletClient> | null;
};

const WalletContext = createContext<WalletContextType>({
  address: null,
  connected: false,
  connect: async () => {},
  disconnect: () => {},
  walletClient: null,
});

export function WalletProvider({ children }: { children: ReactNode }) {
  const [address, setAddress] = useState<Address | null>(null);
  const [walletClient, setWalletClient] = useState<ReturnType<typeof createWalletClient> | null>(null);

  const connect = useCallback(async () => {
    const eth = getEth();
    if (!eth) {
      alert("Please install MetaMask to use this app.");
      return;
    }
    try {
      const accounts = (await eth.request({ method: "eth_requestAccounts" })) as string[];
      if (accounts.length > 0) {
        // Switch to LitVM testnet
        try {
          await eth.request({
            method: "wallet_switchEthereumChain",
            params: [{ chainId: "0x1159" }],
          });
        } catch (switchErr: unknown) {
          const err = switchErr as { code?: number };
          if (err.code === 4902) {
            await eth.request({
              method: "wallet_addEthereumChain",
              params: [{
                chainId: "0x1159",
                chainName: "LitVM LiteForge",
                nativeCurrency: { name: "zkLTC", symbol: "zkLTC", decimals: 18 },
                rpcUrls: ["https://liteforge.rpc.caldera.xyz/http"],
                blockExplorerUrls: ["https://liteforge.explorer.caldera.xyz"],
              }],
            });
          }
        }
        setAddress(accounts[0] as Address);
        const client = createWalletClient({
          transport: custom(eth as Parameters<typeof custom>[0]),
        });
        setWalletClient(client);
      }
    } catch (err) {
      console.error("Failed to connect wallet:", err);
    }
  }, []);

  const disconnect = useCallback(() => {
    setAddress(null);
    setWalletClient(null);
  }, []);

  // Auto-connect if already authorized
  useEffect(() => {
    const eth = getEth();
    if (!eth) return;
    eth.request({ method: "eth_accounts" }).then((accounts: unknown) => {
      const accs = accounts as string[];
      if (accs.length > 0) {
        setAddress(accs[0] as Address);
        const client = createWalletClient({
          transport: custom(eth as Parameters<typeof custom>[0]),
        });
        setWalletClient(client);
      }
    }).catch(() => {});
  }, []);

  // Listen for account changes
  useEffect(() => {
    const eth = getEth();
    if (!eth) return;
    const handleAccountsChanged = (...args: unknown[]) => {
      const accounts = args[0] as string[];
      if (accounts.length > 0) {
        setAddress(accounts[0] as Address);
      } else {
        setAddress(null);
        setWalletClient(null);
      }
    };
    eth.on("accountsChanged", handleAccountsChanged);
    return () => {
      eth.removeListener("accountsChanged", handleAccountsChanged);
    };
  }, []);

  return (
    <WalletContext.Provider value={{ address, connected: !!address, connect, disconnect, walletClient }}>
      {children}
    </WalletContext.Provider>
  );
}

export function useWallet() {
  return useContext(WalletContext);
}
