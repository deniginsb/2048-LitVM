import { useNetwork } from "@/contexts/NetworkContext";

type NetworkToggleProps = {
	hasActiveGame: boolean;
	onNetworkChange: () => void;
};

export default function NetworkToggle({
	hasActiveGame: _hasActiveGame,
	onNetworkChange: _onNetworkChange,
}: NetworkToggleProps) {
	const { network } = useNetwork();

	return (
		<div className="flex items-center gap-2">
			<span className="text-sm font-medium text-white">
				{network === "testnet" ? "LitVM Testnet" : "LitVM Testnet"}
			</span>
		</div>
	);
}
