# LitVM 2048 Security & Transparency

This folder documents how the LitVM 2048 session-wallet system works, why it is safe, and what users sign.

## TL;DR

LitVM 2048 uses a session wallet so users can play without approving a MetaMask transaction for every move.

The main wallet signs one EIP-712 typed message:

`AuthorizeGameSession(player, session, nonce, expiresAt)`

Then the session wallet sends gameplay transactions for up to 24 hours.

Important properties:

- The main wallet private key is never exposed.
- The signed permission is scoped to this contract and LitVM chain ID 4441.
- The permission expires after 24 hours.
- The session wallet can only play this 2048 contract. It cannot move user funds.
- Gameplay events record the main wallet as `player`.
- Transaction sender (`tx.from`) is the session wallet, because it pays gas.

## Deployed Contract

Current LitVM contract:

`0x6aC90E13537F130ec8C2b2F2AB7518496D07dB8B`

Network:

- Chain: LitVM LiteForge
- Chain ID: 4441
- RPC: https://liteforge.rpc.caldera.xyz/http
- Explorer: https://liteforge.explorer.caldera.xyz

## Security Documents

- `EIP712_SESSION_MODEL.md` — detailed session authorization model
- `WHAT_USERS_SIGN.md` — exact typed data shown to wallets
- `THREAT_MODEL.md` — risks and mitigations
- `ONCHAIN_TEST_PROOF.md` — tests performed before deploy
- `CONTRACT_API.md` — relevant contract functions and events

## For Reviewers

Review these files in the codebase:

- Contract: `../src/Monad2048.sol`
- Frontend transaction hook: `../src/hooks/useTransactions.tsx`
- Session wallet context: `../src/contexts/SessionWalletContext.tsx`
- Contract address constant: `../src/utils/constants.ts`

## Key Design Choice

There are three possible UX/security models:

1. Main wallet sends every transaction.
   - Pros: `tx.from` is the main wallet.
   - Cons: MetaMask popup appears for every move.

2. Session wallet sends transactions after one EIP-712 authorization.
   - Pros: Smooth gameplay, only one signature popup per 24h.
   - Cons: `tx.from` is the session wallet, but contract events record the main wallet as `player`.

3. Custodial server key.
   - Not used.
   - We do not store user private keys.

LitVM 2048 uses option 2.
