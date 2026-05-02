# On-Chain Test Proof

This document records the tests performed before deploying the EIP-712 session-wallet version.

## Contract Tests

Foundry test result:

```text
Ran 23 tests: 23 passed, 0 failed, 0 skipped
```

Covered:

- Original direct wallet gameplay flow
- Longer game progression
- Board validation logic
- EIP-712 session wallet authorization
- Session expiry failure
- Session wallet `startGame`
- Session wallet `play`

Specific new tests:

- `testSessionWalletFlow()`
- `testSessionExpiryFails()`

## Deployed Contract

Contract:

`0x6aC90E13537F130ec8C2b2F2AB7518496D07dB8B`

## Live On-Chain Script Test

A live script was run against LitVM LiteForge.

### Test Flow

1. Main wallet funds a fresh session wallet.
2. Main wallet signs EIP-712 `AuthorizeGameSession`.
3. Session wallet submits `authorizeSession`.
4. Session wallet submits `startGame`.
5. Script reads `latestBoard` and verifies it matches expected board.

### Main Wallet Used For Test

`0x40C2fbE3B879973b79FEa57Bd880Ea9E72786240`

### Test Transactions

Fund session wallet:

`0x8d237fc3505f65ab9a4504a1481b65a2ef5910aac9338d94cbb0ed6b4c1e5c40`

Authorize session:

`0xd2a2c311affffdc3ea91852fa03dcfa1d2389c05b821b6d1141c2f4707a68515`

Start game:

`0xdde64b2c2770aa87cb174cad7fd38eaf2f4beecb59152f772e5e0d3ff4c05797`

### Script Output Summary

```text
stored player 0x40C2fbE3B879973b79FEa57Bd880Ea9E72786240
latest ok true
```

## Frontend Deployment Verification

Deployed URL:

https://litvm-2048-frontend.vercel.app

Browser bundle was verified to include:

- new contract address: `0x6aC90E13537F130ec8C2b2F2AB7518496D07dB8B`
- `AuthorizeGameSession`
- `authorizeSession`

## What Was Not Fully Automated

A real MetaMask popup flow cannot be fully tested in the headless browser environment used by the agent.

The following were tested instead:

- contract logic with Foundry
- live chain interaction with viem using the same EIP-712 typed data
- frontend build and deployment
- deployed JS bundle contents
