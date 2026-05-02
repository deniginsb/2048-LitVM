# Threat Model

## Assets Protected

- Main wallet private key
- Main wallet funds and token approvals
- Correct attribution of gameplay to the main wallet
- Integrity of 2048 game state
- Prevention of replayed or forged session authorizations

## Trust Boundaries

### Main Wallet

The main wallet is controlled by the user through MetaMask or another wallet provider.

The app never receives the main wallet private key.

### Session Wallet

The session wallet is generated locally in the browser and stored in localStorage.

It holds only the small amount of zkLTC funded by the user for gas.

### Contract

The contract is the enforcement layer. It validates:

- EIP-712 signatures
- session expiry
- one-time nonce usage
- gameId ownership
- board transitions

## Threats and Mitigations

### Replay attack on another chain

Risk: A signature could be reused on another chain.

Mitigation: EIP-712 domain includes `chainId: 4441`.

### Replay attack on another contract

Risk: A signature could be reused on a malicious contract.

Mitigation: EIP-712 domain includes `verifyingContract`.

### Replay attack on same contract

Risk: The same signature could authorize multiple sessions.

Mitigation: `usedSessionNonces[player][nonce]` prevents nonce reuse.

### Long-lived permission

Risk: A compromised session wallet could continue playing indefinitely.

Mitigation: session authorization has `expiresAt`; frontend uses 24 hours.

### Session wallet steals user funds

Risk: Session wallet might move funds from main wallet.

Mitigation: impossible under this model. The session wallet never receives main wallet private key or token approvals.

### Session wallet spends its own gas funds

Risk: If session private key is compromised, attacker can spend zkLTC held by the session wallet.

Mitigation: users should only fund the session wallet with a small amount needed for gameplay.

### Forged player attribution

Risk: A session wallet pretends to be another player.

Mitigation: contract requires valid EIP-712 signature from that player and validates `gameId` against the player address.

### Invalid board submissions

Risk: Session wallet submits impossible 2048 board states.

Mitigation: contract validates each transformation using `Board.validateTransformation`.

### Frontend bug / malicious frontend

Risk: Frontend asks user to sign unsafe typed data.

Mitigation:

- Users can inspect typed data in their wallet.
- The intended typed data is documented in `WHAT_USERS_SIGN.md`.
- Contract only accepts `AuthorizeGameSession` digest matching its domain and typehash.

## Remaining Limitations

- Explorer `tx.from` will be the session wallet, not the main wallet.
- Main wallet is recorded as `player` in events and gameId.
- If a third-party quest only checks `tx.from`, it will see the session wallet.
- If a third-party quest checks contract events or game ownership, it will see the main wallet as player.
