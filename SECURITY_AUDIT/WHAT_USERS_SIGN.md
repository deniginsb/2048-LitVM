# What Users Sign

Users sign exactly one EIP-712 typed message to authorize gameplay from a browser-generated session wallet.

## Typed Data

```json
{
  "domain": {
    "name": "LitVM 2048",
    "version": "1",
    "chainId": 4441,
    "verifyingContract": "0x6aC90E13537F130ec8C2b2F2AB7518496D07dB8B"
  },
  "types": {
    "AuthorizeGameSession": [
      { "name": "player", "type": "address" },
      { "name": "session", "type": "address" },
      { "name": "nonce", "type": "uint256" },
      { "name": "expiresAt", "type": "uint256" }
    ]
  },
  "primaryType": "AuthorizeGameSession",
  "message": {
    "player": "<main wallet address>",
    "session": "<local browser session wallet>",
    "nonce": "<unique timestamp nonce>",
    "expiresAt": "<unix timestamp, about 24h from signing>"
  }
}
```

## Plain-English Meaning

The user is signing:

> I authorize this specific session wallet to play LitVM 2048 as my wallet until the expiry timestamp.

## User-Facing Expectations

A wallet should show:

- App/Domain: LitVM 2048
- Chain ID: 4441
- Verifying contract: `0x6aC90E13537F130ec8C2b2F2AB7518496D07dB8B`
- Player: user's main wallet
- Session: temporary session wallet
- Nonce: unique number
- Expiry: timestamp

## Red Flags

Users should reject signatures if:

- chainId is not 4441
- verifyingContract is not `0x6aC90E13537F130ec8C2b2F2AB7518496D07dB8B`
- the message is not `AuthorizeGameSession`
- expiry is unexpectedly far in the future
- player address is not their wallet
- session address is not shown by the website as the session wallet

## Not a Token Approval

This is not an ERC-20 approval and not an NFT approval.

No `approve`, `permit`, or `setApprovalForAll` is requested by the gameplay authorization.
