import { Copy, Loader2, RefreshCw } from "lucide-react";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { formatEther, type Hex } from "viem";
import { useAccount, useSendTransaction, useWaitForTransactionReceipt } from "wagmi";
import {
	AlertDialog,
	AlertDialogAction,
	AlertDialogCancel,
	AlertDialogContent,
	AlertDialogDescription,
	AlertDialogFooter,
	AlertDialogHeader,
	AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { useNetwork } from "@/contexts/NetworkContext";
import { useSessionWallet } from "@/contexts/SessionWalletContext";
import { Button } from "./ui/button";

export type FaucetDialogProps = {
	isOpen: boolean;
	resyncGame: () => Promise<void>;
	setIsOpen: (open: boolean) => void;
};
export function FaucetDialog({
	isOpen,
	setIsOpen,
	resyncGame,
}: FaucetDialogProps) {
	const { address: mainAddress } = useAccount();
	const { sessionWallet } = useSessionWallet();
	const { publicClient, network } = useNetwork();
	const { sendTransaction, data: txHash, isPending: isSending, reset: resetTx } = useSendTransaction();

	const [balance, setBalance] = useState(0n);
	const [sessionBalance, setSessionBalance] = useState(0n);
	const [resumeLoading, setResumeLoading] = useState(false);
	const [refreshingBalance, setRefreshingBalance] = useState(false);
	const [fundingSession, setFundingSession] = useState(false);

	const { isLoading: isConfirming, isSuccess: isConfirmed } = useWaitForTransactionReceipt({
		hash: txHash,
	});

	const sessionAddress = sessionWallet?.address;

	async function setupUser() {
		if (!sessionAddress) {
			setBalance(0n);
			setSessionBalance(0n);
			return;
		}

		// Get main wallet balance
		if (mainAddress) {
			try {
				const mainBal = await publicClient.getBalance({
					address: mainAddress as Hex,
				});
				setBalance(mainBal);
			} catch (e) {
				console.error("Failed to get main balance:", e);
			}
		}

		// Get session wallet balance
		try {
			const sessionBal = await publicClient.getBalance({
				address: sessionAddress as Hex,
			});
			setSessionBalance(sessionBal);
		} catch (e) {
			console.error("Failed to get session balance:", e);
		}
	}

	// When tx confirms, refresh balances
	useEffect(() => {
		if (isConfirmed) {
			toast.success("Session wallet funded!");
			setFundingSession(false);
			resetTx();
			setupUser();
		}
	}, [isConfirmed]);

	const handleClose = async () => {
		setResumeLoading(true);
		try {
			await resyncGame();
		} catch (e) {
			console.error("Resync failed:", e);
		}
		setResumeLoading(false);
		setIsOpen(false);
	};

	const handleRefreshBalance = async () => {
		setRefreshingBalance(true);
		await setupUser();
		setRefreshingBalance(false);
	};

	const handleFundSession = async () => {
		if (!sessionAddress) return;
		setFundingSession(true);
		try {
			sendTransaction({
				to: sessionAddress as Hex,
				value: BigInt("50000000000000000"), // 0.05 zkLTC
			});
			toast.info("Confirm the transaction in your wallet...");
		} catch (err) {
			console.error("Failed to fund session:", err);
			toast.error("Failed to fund session wallet");
			setFundingSession(false);
		}
	};

	useEffect(() => {
		if (!isOpen) return;
		setupUser();
	}, [sessionAddress, isOpen, network]);

	const abbreviatedSessionAddress = sessionAddress
		? `${sessionAddress.slice(0, 6)}...${sessionAddress.slice(-4)}`
		: "";

	const copyToClipboard = async () => {
		if (sessionAddress) {
			await navigator.clipboard.writeText(sessionAddress);
			toast.info("Copied to clipboard.");
		}
	};

	const sessionHasBalance = parseFloat(formatEther(sessionBalance)) >= 0.01;

	return (
		<AlertDialog open={isOpen}>
			<AlertDialogContent className="bg-yellow-600 w-[95vw] max-w-md sm:max-w-lg rounded-lg px-4 py-6 overflow-y-auto max-h-[90vh]">
				<AlertDialogHeader>
					<AlertDialogTitle className="text-black text-center">
						Fund your session wallet to play
					</AlertDialogTitle>
					<AlertDialogDescription asChild>
						<div className="flex flex-col gap-3 text-sm sm:text-base text-gray-800">
							<div className="flex items-center justify-center gap-2 text-gray-800 break-all">
								<span>Session: {abbreviatedSessionAddress}</span>
								<Button variant="ghost" size="icon" className="h-6 w-6 p-1" onClick={copyToClipboard}>
									<Copy className="h-4 w-4" />
								</Button>
							</div>
							<div className="text-gray-800 flex items-center justify-center gap-2">
								<span>Session Balance</span>: {formatEther(sessionBalance)} zkLTC
								<Button variant="ghost" size="icon" className="h-6 w-6 p-1" onClick={handleRefreshBalance} disabled={refreshingBalance}>
									<RefreshCw className={`h-4 w-4 ${refreshingBalance ? "animate-spin" : ""}`} />
								</Button>
							</div>
							<div className="text-gray-800 flex items-center justify-center gap-2">
								<span>Main Wallet</span>: {formatEther(balance)} zkLTC
							</div>
							<p className="text-center">
								The game uses a session wallet for fast moves without popup confirmations.
								Fund it with your main wallet to start playing.
							</p>
						</div>
					</AlertDialogDescription>
				</AlertDialogHeader>
				<AlertDialogFooter>
					<AlertDialogCancel
						disabled={!sessionHasBalance}
						onClick={handleClose}
						className="bg-white text-gray-900 hover:bg-gray-100"
					>
						{resumeLoading && <Loader2 className="w-5 h-5 animate-spin mr-2" />}
						{!resumeLoading ? "Resume" : "Re-syncing..."}
					</AlertDialogCancel>
					<AlertDialogAction asChild>
						<Button
							className="outline outline-gray-300 bg-white text-gray-900 hover:bg-gray-100"
							disabled={sessionHasBalance || fundingSession || isSending || isConfirming}
							onClick={handleFundSession}
						>
							{fundingSession || isSending || isConfirming ? (
								<>
									<Loader2 className="w-5 h-5 animate-spin mr-2" />
									{isConfirming ? "Confirming..." : "Funding..."}
								</>
							) : (
								"Fund Session (0.05 zkLTC)"
							)}
						</Button>
					</AlertDialogAction>
				</AlertDialogFooter>
			</AlertDialogContent>
		</AlertDialog>
	);
}
