# UniswapPaymaster Monorepo

A pnpm workspace monorepo for UniswapPaymaster smart contracts, TypeScript SDK, and integration tests.

## Structure

```
paymaster-monorepo/
├── contracts/          @uniswap-paymaster/contracts (Foundry, publishable)
├── sdk/                @uniswap-paymaster/sdk (TypeScript/Viem, publishable)
└── integration/        @uniswap-paymaster/integration-tests (Hardhat, private)
```

## Quick Start

```bash
# Prerequisites: Node.js >= 20, pnpm >= 9, Foundry
npm install -g pnpm

# Setup
pnpm install
cd contracts && forge install && cd ..
pnpm build

```

## Common Commands

```bash
# Build
pnpm build                  # All packages
pnpm build:contracts        # forge build
pnpm build:sdk             # tsc

# Test
pnpm test                   # All tests
pnpm test:contracts        # Foundry tests (Solidity)
pnpm test:integration      # Hardhat tests (TypeScript)

# Development
pnpm dev:sdk               # Watch mode for SDK
cd contracts && forge test -vvv

# Lint
pnpm lint                  # All packages
pnpm lint:contracts        # Solidity
pnpm lint:sdk              # TypeScript SDK
```

## Package Details

### `contracts/` - Foundry Package
- Solidity development with Foundry
- Dependencies via git submodules in `lib/`
- Publishes: `src/`, `out/` (ABIs), `foundry.toml`, `remappings.txt`
- Standard Foundry workflow: `forge build`, `forge test`, `forge fmt`

### `sdk/` - TypeScript Package
- TypeScript SDK built on Viem
- Provides paymaster client and Permit2 helpers
- Publishes: `dist/` (compiled JS + types)
- For external apps/wallets to integrate gasless transactions

### `integration/` - Integration Tests
- Hardhat + Viem for end-to-end testing
- Uses both `contracts` and `sdk` via `workspace:*` dependencies
- Not published (marked `private: true`)
- Shows real-world usage examples

## Development Workflow

### Working on Contracts
```bash
cd contracts
forge test -vvv
forge fmt
forge build
```

### Working on SDK
```bash
cd sdk
pnpm dev        # Watch mode
pnpm build
```

### Integration Testing
```bash
cd integration
pnpm test       # Builds contracts, generates ABIs, runs tests
```

## Adding Dependencies

```bash
# Foundry dependency (Solidity library)
cd contracts && forge install OpenZeppelin/openzeppelin-contracts

# npm dependency to SDK
pnpm --filter @uniswap-paymaster/sdk add <package>

# npm dependency to integration
pnpm --filter @uniswap-paymaster/integration-tests add -D <package>
```

## Publishing to npm

```bash
# Build and test
pnpm build
pnpm test

# Update versions in contracts/package.json and sdk/package.json

# Publish contracts
cd contracts && npm publish --access public

# Publish SDK
cd sdk && npm publish --access public
```

## Architecture

```
External Apps/Wallets
        ↓
    @uniswap-paymaster/sdk (imports ABIs from)
        ↓
    @uniswap-paymaster/contracts
        ↑
        │ (tested together by)
    integration/
```