# 2048 LitVM

On-chain 2048 game deployed on LitVM LiteForge testnet with EIP-712 session-wallet authorization.

Live app:

https://litvm-2048-frontend.vercel.app

## Why Session Wallet?

A 2048 game can require many moves. If the main wallet sends every transaction, MetaMask will ask for confirmation on every move.

This version uses a session wallet:

1. User connects main wallet.
2. User funds a local browser session wallet with small zkLTC for gas.
3. User signs one EIP-712 `AuthorizeGameSession` message.
4. Session wallet submits gameplay transactions for 24 hours without more popups.

The contract records the main wallet as `player` in game events.

## Security / Transparency

See the audit documentation folder:

`SECURITY_AUDIT/`

Key files:

- `SECURITY_AUDIT/README.md`
- `SECURITY_AUDIT/EIP712_SESSION_MODEL.md`
- `SECURITY_AUDIT/WHAT_USERS_SIGN.md`
- `SECURITY_AUDIT/THREAT_MODEL.md`
- `SECURITY_AUDIT/ONCHAIN_TEST_PROOF.md`
- `SECURITY_AUDIT/CONTRACT_API.md`

## Deployed Contract

LitVM LiteForge contract:

`0x6aC90E13537F130ec8C2b2F2AB7518496D07dB8B`

Network:

- Chain ID: 4441
- RPC: https://liteforge.rpc.caldera.xyz/http
- Explorer: https://liteforge.explorer.caldera.xyz
- Gas token: zkLTC

## What Users Sign

Users sign typed data with domain:

```text
name: LitVM 2048
version: 1
chainId: 4441
verifyingContract: 0x6aC90E13537F130ec8C2b2F2AB7518496D07dB8B
```

Primary type:

```solidity
AuthorizeGameSession(address player,address session,uint256 nonce,uint256 expiresAt)
```

This is not an ERC-20 approval and not an NFT approval.

## Development

```bash
npm install
npm run dev
```

Build:

```bash
npm run build
```

## Credits

Based on Monad 2048 and the original 2048 game.
