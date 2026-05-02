import { createContext, useContext, useState, useEffect, useCallback, type ReactNode } from "react";
import { createWalletClient, http, type Address, type Hex, type WalletClient, type Transport, type Chain } from "viem";
import { privateKeyToAccount, generatePrivateKey, type PrivateKeyAccount } from "viem/accounts";
import { litvmTestnet } from "@/config/wagmi";

type SessionWallet = {
  address: Address;
  privateKey: Hex;
  account: PrivateKeyAccount;
  walletClient: WalletClient<Transport, Chain, PrivateKeyAccount>;
};

type SessionWalletContextType = {
  sessionWallet: SessionWallet | null;
  isReady: boolean;
  fundSessionWallet: () => Promise<void>;
  getSessionAddress: () => Address | null;
};

const SessionWalletContext = createContext<SessionWalletContextType>({
  sessionWallet: null,
  isReady: false,
  fundSessionWallet: async () => {},
  getSessionAddress: () => null,
});

const STORAGE_KEY = "litvm2048_session_key";

export function SessionWalletProvider({ children }: { children: ReactNode }) {
  const [sessionWallet, setSessionWallet] = useState<SessionWallet | null>(null);
  const [isReady, setIsReady] = useState(false);

  // Load or create session wallet
  useEffect(() => {
    let storedKey = localStorage.getItem(STORAGE_KEY) as Hex | null;
    if (!storedKey) {
      storedKey = generatePrivateKey();
      localStorage.setItem(STORAGE_KEY, storedKey);
    }

    const account = privateKeyToAccount(storedKey);
    const client = createWalletClient({
      account,
      chain: litvmTestnet,
      transport: http(litvmTestnet.rpcUrls.default.http[0]),
    });

    setSessionWallet({
      address: account.address,
      privateKey: storedKey,
      account,
      walletClient: client,
    });
    setIsReady(true);
  }, []);

  const fundSessionWallet = useCallback(async () => {
    if (!sessionWallet) return;
    console.log("Session wallet address:", sessionWallet.address);
  }, [sessionWallet]);

  const getSessionAddress = useCallback(() => {
    return sessionWallet?.address ?? null;
  }, [sessionWallet]);

  return (
    <SessionWalletContext.Provider value={{ sessionWallet, isReady, fundSessionWallet, getSessionAddress }}>
      {children}
    </SessionWalletContext.Provider>
  );
}

export function useSessionWallet() {
  return useContext(SessionWalletContext);
}
