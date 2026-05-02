# Security Checklist

Use this checklist before pushing or announcing a new deployment.

## Contract

- [x] EIP-712 domain includes app name
- [x] EIP-712 domain includes version
- [x] EIP-712 domain includes chain ID 4441
- [x] EIP-712 domain includes verifying contract address
- [x] Session authorization has expiry
- [x] Session authorization has nonce
- [x] Nonce cannot be reused
- [x] Signature recovers to main wallet / player
- [x] Expired session reverts
- [x] GameId still validates main wallet address
- [x] Board transitions still validated on-chain
- [x] Events emit main wallet as player

## Frontend

- [x] Session wallet generated locally
- [x] Main wallet signs EIP-712 typed data only
- [x] Session wallet pays gas for gameplay
- [x] Contract address constant points to latest deployment
- [x] User can inspect session address
- [x] User funds session wallet with limited amount
- [x] No main wallet private key is requested
- [x] No ERC-20 or NFT approvals are requested for gameplay authorization

## Testing

- [x] Foundry tests pass
- [x] Live on-chain authorizeSession tested
- [x] Live on-chain startGame from session wallet tested
- [x] latestBoard verified after live startGame
- [x] Frontend builds successfully
- [x] Vercel deployment completed
- [x] Deployed bundle contains new contract address and EIP-712 strings

## Known Limitation

- [ ] Real MetaMask popup flow must be checked manually in a normal browser.

Reason: the automated test environment is headless and cannot complete a real wallet popup.
