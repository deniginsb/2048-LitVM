import { ConnectButton } from "@rainbow-me/rainbowkit";
import { useAccount } from "wagmi";
import { Copy } from "lucide-react";
import { toast } from "sonner";
import { Button } from "./ui/button";

type LoginButtonProps = {
	resetGame: () => void;
};

export default function LoginButton({ resetGame }: LoginButtonProps) {
	const { isConnected } = useAccount();

	if (isConnected) {
		return (
			<button
				onClick={resetGame}
				className="px-8 py-3 font-bold text-gray-900 bg-white rounded-xl hover:scale-105 active:scale-95 transition-all shadow-[0_8px_0_rgb(200,200,200)] hover:shadow-[0_6px_0_rgb(200,200,200)]"
			>
				New Game
			</button>
		);
	}

	return <ConnectButton />;
}

export function PlayerInfo() {
	const { address } = useAccount();

	const copyToClipboard = async () => {
		if (address) {
			await navigator.clipboard.writeText(address);
			toast.info("Copied to clipboard.");
		}
	};

	const abbreviatedAddress = address
		? `${address.slice(0, 4)}...${address.slice(-2)}`
		: "";

	return (
		<div className="flex items-center gap-1 whitespace-nowrap">
			<span>
				<span className="font-bold">Player</span>:
			</span>{" "}
			{abbreviatedAddress}
			<Button
				variant="ghost"
				size="icon"
				className="h-6 w-6 p-0.5"
				onClick={copyToClipboard}
			>
				<Copy className="h-3.5 w-3.5" />
			</Button>
		</div>
	);
}
