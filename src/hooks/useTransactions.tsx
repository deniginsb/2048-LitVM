import { ExternalLink } from "lucide-react";
import { useEffect, useRef } from "react";
import { toast } from "sonner";
import { type Address, encodeFunctionData, type Hex, formatEther } from "viem";
import { useAccount, useSignTypedData } from "wagmi";
import { Button } from "@/components/ui/button";
import { useNetwork } from "@/contexts/NetworkContext";
import { useSessionWallet } from "@/contexts/SessionWalletContext";
import { GAME_CONTRACT_ADDRESS } from "@/utils/constants";

const GAS_LIMIT = 500000n;
const CHAIN_ID = 4441;
const SESSION_DURATION_SECONDS = 24 * 60 * 60;

const AUTHORIZE_SESSION_ABI = [
  {
    type: "function",
    name: "authorizeSession",
    inputs: [
      { name: "player", type: "address" },
      { name: "session", type: "address" },
      { name: "nonce", type: "uint256" },
      { name: "expiresAt", type: "uint256" },
      { name: "signature", type: "bytes" },
    ],
    outputs: [],
    stateMutability: "nonpayable",
  },
] as const;

const SESSION_READ_ABI = [
  {
    type: "function",
    name: "sessionPlayer",
    inputs: [{ name: "session", type: "address" }],
    outputs: [{ name: "player", type: "address" }],
    stateMutability: "view",
  },
  {
    type: "function",
    name: "sessionExpiresAt",
    inputs: [{ name: "session", type: "address" }],
    outputs: [{ name: "expiresAt", type: "uint256" }],
    stateMutability: "view",
  },
] as const;

export function useTransactions() {
  const { network, publicClient, explorerUrl } = useNetwork();
  const { address: playerAddress, isConnected } = useAccount();
  const { signTypedDataAsync } = useSignTypedData();
  const { sessionWallet } = useSessionWallet();

  const sessionAddress = useRef<Address | null>(null);
  const localNonce = useRef<number | null>(null);
  const txLock = useRef<Promise<void>>(Promise.resolve());
  const authInFlight = useRef<Promise<void> | null>(null);

  useEffect(() => {
    if (sessionWallet) {
      sessionAddress.current = sessionWallet.address;
      console.log("Session wallet ready:", sessionWallet.address);
      localNonce.current = null;
    }
  }, [sessionWallet]);

  async function resetNonceAndBalance() {
    localNonce.current = null;
  }

  async function checkBalance() {
    if (!sessionWallet) return 0n;
    const bal = await publicClient.getBalance({
      address: sessionWallet.address as Address,
    });
    console.log(`Session balance: ${formatEther(bal)} zkLTC`);
    return bal;
  }

  async function getNextNonce(): Promise<number> {
    if (!sessionWallet) throw Error("Session wallet not ready");
    if (localNonce.current === null) {
      localNonce.current = await publicClient.getTransactionCount({
        address: sessionWallet.address as Address,
        blockTag: "latest",
      });
      console.log(`Session nonce initialized from chain: ${localNonce.current}`);
    }
    const nonce = localNonce.current;
    localNonce.current = nonce + 1;
    console.log(`Using session nonce: ${nonce} (next will be ${localNonce.current})`);
    return nonce;
  }

  async function sendSessionRawTx({ data, successText }: { data: Hex; successText?: string }) {
    if (!sessionWallet) throw Error("Session wallet not ready");

    const nonce = await getNextNonce();
    let gasPrice: bigint | undefined;
    try {
      gasPrice = await publicClient.getGasPrice();
      console.log(`Gas price: ${gasPrice}`);
    } catch {
      console.log("Could not get gas price, using default");
    }

    const hash = await sessionWallet.walletClient.sendTransaction({
      to: GAME_CONTRACT_ADDRESS[network] as Address,
      data,
      account: sessionWallet.account,
      chain: sessionWallet.walletClient.chain,
      gas: GAS_LIMIT,
      nonce,
      ...(gasPrice ? { gasPrice } : {}),
      type: "legacy" as any,
    });

    console.log(`Session tx sent: ${hash}`);
    const receipt = await publicClient.waitForTransactionReceipt({ hash, timeout: 60000 });
    if (receipt.status === "reverted") {
      localNonce.current = null;
      throw Error(`${successText || "Transaction"} reverted. Hash: ${hash}`);
    }
    return hash;
  }

  async function isSessionAuthorized(): Promise<boolean> {
    if (!playerAddress || !sessionWallet) return false;
    try {
      const [storedPlayer, expiresAt] = await Promise.all([
        publicClient.readContract({
          address: GAME_CONTRACT_ADDRESS[network],
          abi: SESSION_READ_ABI,
          functionName: "sessionPlayer",
          args: [sessionWallet.address as Address],
        }),
        publicClient.readContract({
          address: GAME_CONTRACT_ADDRESS[network],
          abi: SESSION_READ_ABI,
          functionName: "sessionExpiresAt",
          args: [sessionWallet.address as Address],
        }),
      ]);
      const now = BigInt(Math.floor(Date.now() / 1000));
      return storedPlayer.toLowerCase() === playerAddress.toLowerCase() && expiresAt > now + 60n;
    } catch (e) {
      console.error("Failed to check session auth:", e);
      return false;
    }
  }

  async function ensureSessionAuthorized() {
    if (!playerAddress || !isConnected) {
      throw Error("Main wallet not connected. Please connect MetaMask first.");
    }
    if (!sessionWallet) {
      throw Error("Session wallet not ready. Refresh the page and try again.");
    }

    if (await isSessionAuthorized()) {
      console.log("Session already authorized");
      return;
    }

    // Avoid duplicate auth requests if moves are queued quickly.
    if (authInFlight.current) {
      await authInFlight.current;
      return;
    }

    authInFlight.current = (async () => {
      const nonce = BigInt(Date.now());
      const expiresAt = BigInt(Math.floor(Date.now() / 1000) + SESSION_DURATION_SECONDS);

      toast.info("Sign one session authorization in MetaMask...");
      console.log("Requesting EIP-712 session authorization", {
        player: playerAddress,
        session: sessionWallet.address,
        nonce: nonce.toString(),
        expiresAt: expiresAt.toString(),
      });

      const signature = await signTypedDataAsync({
        domain: {
          name: "LitVM 2048",
          version: "1",
          chainId: CHAIN_ID,
          verifyingContract: GAME_CONTRACT_ADDRESS[network] as Address,
        },
        types: {
          AuthorizeGameSession: [
            { name: "player", type: "address" },
            { name: "session", type: "address" },
            { name: "nonce", type: "uint256" },
            { name: "expiresAt", type: "uint256" },
          ],
        },
        primaryType: "AuthorizeGameSession",
        message: {
          player: playerAddress as Address,
          session: sessionWallet.address as Address,
          nonce,
          expiresAt,
        },
      });

      const data = encodeFunctionData({
        abi: AUTHORIZE_SESSION_ABI,
        functionName: "authorizeSession",
        args: [playerAddress as Address, sessionWallet.address as Address, nonce, expiresAt, signature as Hex],
      });

      // Simulate from session wallet before sending.
      await publicClient.call({
        account: sessionWallet.address as Address,
        to: GAME_CONTRACT_ADDRESS[network] as Address,
        data,
      });

      const hash = await sendSessionRawTx({ data, successText: "Session authorization" });
      console.log("Session authorized on-chain:", hash);
      toast.success("Session authorized. Moves will not require popups for 24h.");
    })();

    try {
      await authInFlight.current;
    } finally {
      authInFlight.current = null;
    }
  }

  async function sendGameTx({
    successText,
    data,
  }: {
    successText?: string;
    data: Hex;
  }) {
    const previousTx = txLock.current;
    let resolveTx!: () => void;
    txLock.current = new Promise<void>((resolve) => {
      resolveTx = resolve;
    });

    await previousTx;

    try {
      if (!sessionWallet) {
        throw Error("Session wallet not ready. Refresh the page and try again.");
      }

      const balance = await checkBalance();
      if (balance === 0n) {
        throw Error("Session wallet has no funds. Click Fund Session first.");
      }

      await ensureSessionAuthorized();

      // Simulate game tx from the session wallet.
      try {
        await publicClient.call({
          account: sessionWallet.address as Address,
          to: GAME_CONTRACT_ADDRESS[network] as Address,
          data,
        });
        console.log("Game tx simulation passed, sending session tx...");
      } catch (simErr: any) {
        console.error("Game tx simulation failed:", simErr);
        throw Error(`Transaction would revert: ${simErr.shortMessage || simErr.message?.slice(0, 150)}`);
      }

      const startTime = Date.now();
      const hash = await sendSessionRawTx({ data, successText });
      const time = Date.now() - startTime;

      console.log(`Transaction confirmed in ${time} ms: ${hash}`);
      toast.success(`Confirmed transaction.`, {
        description: `${successText} Time: ${time} ms`,
        action: (
          <Button
            className="outline outline-white"
            variant="ghost"
            onClick={() =>
              window.open(`${explorerUrl}/tx/${hash}`, "_blank", "noopener,noreferrer")
            }
          >
            <div className="flex items-center gap-1 p-1">
              <p>View</p>
              <ExternalLink className="w-4 h-4" />
            </div>
          </Button>
        ),
      });
    } catch (err: any) {
      const msg = err?.message || String(err);
      console.error("Transaction failed:", msg);

      if (msg.includes("insufficient funds") || msg.includes("insufficient balance")) {
        throw Error("Insufficient session funds. Click Fund Session first.");
      }
      if (msg.includes("nonce")) {
        localNonce.current = null;
        throw Error("Transaction nonce error. Try re-syncing the game.");
      }
      if (msg.includes("User rejected") || msg.includes("user rejected")) {
        throw Error("Session authorization rejected by user.");
      }
      throw Error(`Transaction failed: ${msg.slice(0, 120)}`);
    } finally {
      resolveTx();
    }
  }

  async function getLatestGameBoard(
    gameId: Hex,
  ): Promise<
    readonly [
      readonly [number, number, number, number, number, number, number, number, number, number, number, number, number, number, number, number],
      bigint,
    ]
  > {
    if (!gameId || gameId === "0x") {
      const emptyBoard = [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0] as readonly [
        number, number, number, number, number, number, number, number,
        number, number, number, number, number, number, number, number,
      ];
      return [emptyBoard, 0n];
    }

    try {
      const [latestBoard, nextMoveNumber] = await publicClient.readContract({
        address: GAME_CONTRACT_ADDRESS[network],
        abi: [
          {
            type: "function",
            name: "getBoard",
            inputs: [{ name: "gameId", type: "bytes32", internalType: "bytes32" }],
            outputs: [
              { name: "boardArr", type: "uint8[16]", internalType: "uint8[16]" },
              { name: "nextMoveNumber", type: "uint256", internalType: "uint256" },
            ],
            stateMutability: "view",
          },
        ],
        functionName: "getBoard",
        args: [gameId],
      });

      return [latestBoard, nextMoveNumber];
    } catch (err: any) {
      const msg = err?.message || String(err);
      console.error("Failed to read game board:", msg);

      const emptyBoard = [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0] as readonly [
        number, number, number, number, number, number, number, number,
        number, number, number, number, number, number, number, number,
      ];
      return [emptyBoard, 0n];
    }
  }

  async function initializeGameTransaction(
    gameId: Hex,
    boards: readonly [bigint, bigint, bigint, bigint],
    moves: readonly [number, number, number],
  ): Promise<void> {
    console.log("Starting game!", {
      gameId,
      boards: boards.map(b => "0x" + b.toString(16).padStart(32, "0")),
      moves,
    });

    const data = encodeFunctionData({
      abi: [
        {
          type: "function",
          name: "startGame",
          inputs: [
            { name: "gameId", type: "bytes32", internalType: "bytes32" },
            { name: "boards", type: "uint128[4]", internalType: "uint128[4]" },
            { name: "moves", type: "uint8[3]", internalType: "uint8[3]" },
          ],
          outputs: [],
          stateMutability: "nonpayable",
        },
      ],
      functionName: "startGame",
      args: [gameId, boards, moves],
    });
    console.log("startGame calldata:", data);

    await sendGameTx({
      successText: "Started game!",
      data,
    });
  }

  async function playNewMoveTransaction(
    gameId: Hex,
    board: bigint,
    move: number,
    moveCount: number,
  ): Promise<void> {
    console.log(`Playing move ${moveCount}!`, {
      gameId,
      move,
      board: "0x" + board.toString(16).padStart(32, "0"),
    });

    const data = encodeFunctionData({
      abi: [
        {
          type: "function",
          name: "play",
          inputs: [
            { name: "gameId", type: "bytes32", internalType: "bytes32" },
            { name: "move", type: "uint8", internalType: "uint8" },
            { name: "resultBoard", type: "uint128", internalType: "uint128" },
          ],
          outputs: [],
          stateMutability: "nonpayable",
        },
      ],
      functionName: "play",
      args: [gameId, move, board],
    });
    console.log("play calldata:", data);

    await sendGameTx({
      successText: `Played move ${moveCount}`,
      data,
    });
  }

  return {
    resetNonceAndBalance,
    initializeGameTransaction,
    playNewMoveTransaction,
    getLatestGameBoard,
    sessionAddress: sessionAddress.current,
  };
}
