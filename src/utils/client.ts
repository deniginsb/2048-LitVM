import { createPublicClient, http, type PublicClient, defineChain } from "viem";

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
			ws: ["wss://liteforge.rpc.caldera.xyz/ws"],
		},
	},
	blockExplorers: {
		default: {
			name: "LiteForge Explorer",
			url: "https://liteforge.explorer.caldera.xyz",
		},
	},
});

export const testnetRpc =
	import.meta.env.VITE_LITVM_TESTNET_RPC_URL ||
	litvmTestnet.rpcUrls.default.http[0];

export const testnetPublicClient = createPublicClient({
	chain: litvmTestnet,
	transport: http(testnetRpc),
});

type FeeCache = { maxFeePerGas: bigint; maxPriorityFeePerGas: bigint };
const cachedFees: { testnet: FeeCache | null } = {
	testnet: null,
};

export async function getEstimatedFees(
	publicClient: PublicClient,
	network: "testnet",
): Promise<FeeCache> {
	if (cachedFees[network]) {
		return cachedFees[network];
	}

	const fees = await publicClient.estimateFeesPerGas();
	cachedFees[network] = {
		maxFeePerGas: fees.maxFeePerGas,
		maxPriorityFeePerGas: fees.maxPriorityFeePerGas,
	};
	return cachedFees[network];
}
