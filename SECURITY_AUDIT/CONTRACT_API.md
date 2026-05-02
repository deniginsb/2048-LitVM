# Contract API Reference

## Contract

`Monad2048`

Deployed on LitVM LiteForge:

`0x6aC90E13537F130ec8C2b2F2AB7518496D07dB8B`

## Session Authorization

### `authorizeSession`

```solidity
function authorizeSession(
    address player,
    address session,
    uint256 nonce,
    uint256 expiresAt,
    bytes calldata signature
) external
```

Stores `session` as an authorized session wallet for `player` until `expiresAt`.

Validation:

- `session != address(0)`
- `block.timestamp <= expiresAt`
- `usedSessionNonces[player][nonce] == false`
- EIP-712 recovered signer equals `player`

### `hashAuthorizeSession`

```solidity
function hashAuthorizeSession(
    address player,
    address session,
    uint256 nonce,
    uint256 expiresAt
) public view returns (bytes32)
```

Returns the EIP-712 digest signed by the main wallet.

### `sessionPlayer`

```solidity
mapping(address session => address player) public sessionPlayer;
```

Returns the player authorized for a session wallet.

### `sessionExpiresAt`

```solidity
mapping(address session => uint256 expiresAt) public sessionExpiresAt;
```

Returns the expiry timestamp for a session wallet authorization.

### `usedSessionNonces`

```solidity
mapping(address player => mapping(uint256 nonce => bool used)) public usedSessionNonces;
```

Prevents reuse of session authorization signatures.

## Gameplay

### `startGame`

```solidity
function startGame(
    bytes32 gameId,
    uint128[4] calldata boards,
    uint8[3] calldata moves
) external
```

Can be called by:

- the main wallet directly, or
- an authorized session wallet

The contract resolves the real player via `_playerForSender()`.

The `gameId` must encode the real player address in its high 160 bits.

### `play`

```solidity
function play(
    bytes32 gameId,
    uint8 move,
    uint128 resultBoard
) external
```

Can be called by the main wallet or an authorized session wallet.

The contract validates the resulting board using deterministic seed:

```solidity
uint256(keccak256(abi.encodePacked(gameId, uint256(latestState.nextMove))))
```

## Events

### `SessionAuthorized`

```solidity
event SessionAuthorized(
    address indexed player,
    address indexed session,
    uint256 nonce,
    uint256 expiresAt
);
```

### `NewGame`

```solidity
event NewGame(address indexed player, bytes32 indexed id, uint256 board);
```

The `player` field is the main wallet, even when the transaction sender is a session wallet.

### `NewMove`

```solidity
event NewMove(address indexed player, bytes32 indexed id, uint256 move, uint256 result);
```

The `player` field is the main wallet, even when the transaction sender is a session wallet.
