import { getDefaultConfig } from "@rainbow-me/rainbowkit";
import { defineChain } from "viem";

export const litvmTestnet = defineChain({
	id: 4441,
	name: "LitVM LiteForge",
	nativeCurrency: {
		name: "zkLTC",
		symbol: "zkLTC",
		decimals: 18,
	},
	rpcUrls: {
		default: {
			http: ["https://liteforge.rpc.caldera.xyz/http"],
			webSocket: ["wss://liteforge.rpc.caldera.xyz/ws"],
		},
	},
	blockExplorers: {
		default: {
			name: "LiteForge Explorer",
			url: "https://liteforge.explorer.caldera.xyz",
		},
	},
});

export const config = getDefaultConfig({
	appName: "LitVM 2048",
	projectId: "litvm2048game", // WalletConnect project ID - replace with real one
	chains: [litvmTestnet],
});
