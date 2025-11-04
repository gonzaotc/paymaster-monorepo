# Integration Tests

End-to-end integration tests for UniswapPaymaster using Hardhat + Viem + TypeScript.

## Overview

This package tests the full interaction flow between smart contracts and the SDK:
- Deploy contracts to local Hardhat network
- Execute SDK functions against live contracts
- Test full user operation flows

## Usage

```bash
# Run all tests
npm test

# Compile contracts
npm run compile

# Start local node (for manual testing)
npm run node

# Clean artifacts
npm run clean
```

## Structure

- `test/` - Integration test files (.ts)
- `hardhat.config.ts` - Points to `../contracts/src` for Solidity sources

## Dependencies

- `@uniswap-paymaster/contracts` - Smart contract sources and ABIs
- `@uniswap-paymaster/sdk` - TypeScript SDK for client interactions
- Hardhat + Viem for testing infrastructure
