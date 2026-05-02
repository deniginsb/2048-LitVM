import { createContext, type ReactNode, useContext, useState } from "react";
import { type Chain, createPublicClient, http, type PublicClient } from "viem";
import { litvmTestnet } from "@/config/wagmi";

export type Network = "testnet";

type NetworkContextType = {
	network: Network;
	setNetwork: (network: Network) => void;
	chain: Chain;
	publicClient: PublicClient;
	rpcUrl: string;
	explorerUrl: string;
};

const testnetRpc = litvmTestnet.rpcUrls.default.http[0];

const testnetPublicClient = createPublicClient({
	chain: litvmTestnet,
	transport: http(testnetRpc),
});

const NetworkContext = createContext<NetworkContextType | null>(null);

export function NetworkProvider({ children }: { children: ReactNode }) {
	const [network] = useState<Network>("testnet");

	const setNetwork = (_newNetwork: Network) => {
		// Only testnet supported
	};

	const chain = litvmTestnet;
	const publicClient = testnetPublicClient;
	const rpcUrl = testnetRpc;

	return (
		<NetworkContext.Provider
			value={{
				network,
				setNetwork,
				chain,
				publicClient,
				rpcUrl,
				explorerUrl: chain.blockExplorers.default.url,
			}}
		>
			{children}
		</NetworkContext.Provider>
	);
}

export function useNetwork() {
	const context = useContext(NetworkContext);
	if (!context) {
		throw new Error("useNetwork must be used within a NetworkProvider");
	}
	return context;
}
