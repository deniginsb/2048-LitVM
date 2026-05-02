# EIP-712 Session Authorization Model

## Why Sessions Exist

A 2048 game can require many moves. If every move is sent from the user's main wallet, MetaMask will ask for confirmation on every move.

To avoid this, LitVM 2048 uses a session wallet:

1. A fresh session wallet is generated locally in the browser.
2. The user funds it with a small amount of zkLTC for gas.
3. The user signs one EIP-712 typed authorization with their main wallet.
4. The session wallet submits game transactions without more MetaMask popups.

## What the Signature Authorizes

The user signs this typed struct:

```solidity
AuthorizeGameSession(
    address player,
    address session,
    uint256 nonce,
    uint256 expiresAt
)
```

This means:

- `player`: the main wallet / real player address
- `session`: the browser-generated session wallet address
- `nonce`: one-time-use authorization nonce
- `expiresAt`: timestamp when the authorization expires

## Domain Separation

The EIP-712 domain is:

```text
name: LitVM 2048
version: 1
chainId: 4441
verifyingContract: 0x6aC90E13537F130ec8C2b2F2AB7518496D07dB8B
```

This prevents the signature from being reused on:

- another chain
- another contract
- another app name/version

## Contract Verification

The contract verifies:

```solidity
bytes32 digest = hashAuthorizeSession(player, session, nonce, expiresAt);
address signer = _recover(digest, signature);
require(signer == player, SignatureInvalid());
```

Then stores:

```solidity
usedSessionNonces[player][nonce] = true;
sessionPlayer[session] = player;
sessionExpiresAt[session] = expiresAt;
```

## How Gameplay Uses It

When the session wallet calls `startGame` or `play`, the contract resolves the real player:

```solidity
address player = _playerForSender();
```

If `msg.sender` is an authorized session wallet, `player` becomes the main wallet.

Then `gameId` is validated against the main wallet:

```solidity
require(player == address(uint160(uint256(gameId) >> 96)), GamePlayerInvalid());
```

Events emit the main wallet:

```solidity
event NewGame(address indexed player, bytes32 indexed id, uint256 board);
event NewMove(address indexed player, bytes32 indexed id, uint256 move, uint256 result);
```

## What This Does NOT Authorize

This authorization does not give the session wallet permission to:

- transfer the user's tokens
- spend ERC-20 allowances
- approve NFTs
- interact with arbitrary contracts as the user's wallet
- sign messages as the user
- withdraw funds from the main wallet

The session wallet only controls its own funds and can only be treated as the user inside this 2048 contract.

## Expiry

Frontend currently uses a 24-hour session duration.

After expiry:

- `authorizedPlayerOf(session)` returns `address(0)`
- gameplay calls from the session wallet revert with `SessionInvalid`
- user must sign a new EIP-712 authorization
