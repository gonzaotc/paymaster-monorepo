# UniswapPaymaster SDK

A lightweight SDK for interacting with the UniswapPaymaster contract. Pay for transactions with any token using Uniswap V4 liquidity pools.

## Features

- 🔐 **Permit2 Integration** - Gasless token approvals using Permit2
- 🦄 **Uniswap V4** - Leverage any [ETH, Token] pool as a paymaster
- 🌐 **Decentralized** - No centralized service required
- ⚡ **Simple** - Built on viem for easy integration

## Installation

```bash
npm install @uniswap-paymaster/sdk viem
```

## Quick Start

```typescript
import { createPublicClient, http } from 'viem'
import { privateKeyToAccount } from 'viem/accounts'
import { sepolia } from 'viem/chains'
import { buildPaymasterData } from '@uniswap-paymaster/sdk'

// Setup
const client = createPublicClient({
  chain: sepolia,
  transport: http(),
})

const account = privateKeyToAccount('0x...')

// Build paymaster data
const paymasterData = await buildPaymasterData(client, account, {
  poolKey: {
    currency0: '0x0000000000000000000000000000000000000000', // ETH
    currency1: '0x...', // Your token address
    fee: 3000,
    tickSpacing: 60,
    hooks: '0x0000000000000000000000000000000000000000',
  },
  token: '0x...', // Token you're paying with
  maxTokenAmount: 1000000n, // Max tokens willing to spend
  paymasterAddress: '0x...', // UniswapPaymaster address
  permit2Address: '0x000000000022D473030F116dDEE9F6B43aC78BA3',
  userAddress: account.address,
})

// Use with viem's account abstraction
// (paymasterData goes into your UserOperation)
```

## API Reference

### `buildPaymasterData`

Builds complete paymaster data including Permit2 signature.

```typescript
async function buildPaymasterData(
  client: Client,
  account: LocalAccount,
  params: {
    poolKey: PoolKey
    token: Address
    maxTokenAmount: bigint
    paymasterAddress: Address
    permit2Address: Address
    userAddress: Address
    deadline?: bigint // Optional
    nonce?: bigint // Optional, auto-fetched
  }
): Promise<Hex>
```

### `signPermit2`

Signs a Permit2 permit using EIP-712.

```typescript
async function signPermit2(params: {
  account: LocalAccount
  chainId: number
  permit2Address: Address
  permit: Permit2Permit
}): Promise<Hex>
```

### `getPermit2Nonce`

Fetches the current Permit2 nonce for a user.

```typescript
async function getPermit2Nonce(
  client: Client,
  params: {
    permit2Address: Address
    owner: Address
    token: Address
    spender: Address
  }
): Promise<bigint>
```

## How It Works

1. **User wants to pay with tokens** instead of ETH
2. **SDK builds Permit2 permit** - allows paymaster to spend tokens
3. **User signs permit** - no on-chain transaction needed
4. **Paymaster swaps tokens for ETH** via Uniswap V4 during validation
5. **Transaction executes** - paid for by the paymaster

## Types

```typescript
type PoolKey = {
  currency0: Address // Must be address(0) for ETH
  currency1: Address // Your token address
  fee: number
  tickSpacing: number
  hooks: Address
}

type Permit2Permit = {
  details: {
    token: Address
    amount: bigint
    expiration: bigint
    nonce: bigint
  }
  spender: Address
  sigDeadline: bigint
}
```

## Examples

See the [examples](./examples) directory for complete integration examples.

## License

MIT

