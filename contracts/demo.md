# Paymaster Pools Demo Script

## Overview

This demo showcases the **Paymaster Pools** system - a permissionless, decentralized gas abstraction solution that transforms any Uniswap V4 [ETH, Token] pool into a paymaster pool. Users can pay for transactions in any ERC-20 token without needing native currency.

## Key Benefits Demonstrated

1. **Permissionless Liquidity Provision**: Anyone can become a sponsoring liquidity provider
2. **Distributed Profit Sharing**: Sponsoring profits distributed proportionally to LPs
3. **Free-Market Price Discovery**: Market-driven sponsorship fees through pool competition
4. **Enhanced Capital Efficiency**: LP tokens serve dual purpose (trading + sponsorship)

---

## Demo Flow

### 1. System Setup & Deployment

**Contracts Deployed:**
- **UniswapPaymaster**: Core paymaster contract
- **EntryPointVault**: ERC-4626-style vault for pooled EntryPoint deposits
- **AsymmetricFeeHook**: Optional hook to reduce token→ETH swap fees
- **ERC20Mock**: Demo token for testing
- **MinimalAccountEIP7702**: EIP-7702 account for delegation

**Key Addresses:**
```
EntryPoint: 0x4337084D9E255Ff0702461CF8895CE9E3b5Ff108
Permit2: 0x000000000022D473030F116dDEE9F6B43aC78BA3
Paymaster: [DEPLOYED_ADDRESS]
Token: [DEPLOYED_ADDRESS]
Pool Manager: 0xE03A1074c86CFeDd5C142C4F04F1a1536e203543
```

**Participants:**
- **Bundler**: Executes user operations
- **Depositor**: Provides initial EntryPoint funding
- **LP1, LP2**: Liquidity providers
- **EOA**: End user with tokens but no ETH
- **Receiver**: Token recipient

### 2. Pool Initialization

**Uniswap V4 Pool Created:**
- **Currency0**: Native ETH (address(0))
- **Currency1**: Demo ERC-20 token
- **Fee**: 100 (0.01%)
- **Tick Spacing**: 60
- **Hooks**: None (or AsymmetricFeeHook for reduced fees)

**Pool Key:**
```solidity
PoolKey({
    currency0: Currency.wrap(address(0)),     // ETH
    currency1: Currency.wrap(tokenAddress),   // Token
    fee: 100,                                 // 0.01%
    tickSpacing: 60,
    hooks: IHooks(address(0))                 // No hooks
})
```

### 3. Liquidity Provision

**LP1 adds liquidity:**
- **Liquidity Amount**: 1e15 (1,000,000,000,000,000)
- **ETH Amount**: ~0.1 ETH (calculated based on current price)
- **Token Amount**: Calculated to maintain 1:1 ratio

**Process:**
1. LP1 approves token spending
2. LP1 calls `modifyLiquidity` with ETH and tokens
3. Liquidity is added to the pool
4. LP1 receives LP tokens representing their share

**Result:**
- Pool now has liquidity for both trading and sponsorship
- LP1 earns fees from both swap volume and sponsorship usage
- Capital efficiency increased - same liquidity serves dual purpose

### 4. EntryPoint Funding

**Depositor funds the paymaster:**
- **Amount**: 1 ETH
- **Purpose**: Initial EntryPoint deposit for user operation prefunding
- **Mechanism**: ERC-4626-style vault with proportional shares

**Process:**
1. Depositor calls `deposit(1 ether)` on EntryPointVault
2. ETH is deposited to EntryPoint
3. Depositor receives EPV (EntryPoint Vault) shares
4. Paymaster can now prefund user operations

### 5. Gasless Transaction Sponsorship

**Scenario**: EOA has 1000 tokens but no ETH, wants to send 1 token to receiver

**Step 1: Permit2 Signature**
```solidity
IAllowanceTransfer.PermitSingle memory permitSingle = IAllowanceTransfer.PermitSingle({
    details: IAllowanceTransfer.PermitDetails({
        token: address(token),
        amount: type(uint160).max,           // Large allowance
        expiration: uint48(block.timestamp + 1 hours),
        nonce: 0
    }),
    spender: address(paymaster),             // Paymaster gets permission
    sigDeadline: uint48(block.timestamp + 1 hours)
});
```

**Step 2: User Operation Construction**
```solidity
PackedUserOperation memory userOp = PackedUserOperation({
    sender: EOA,
    nonce: account.getNonce(),
    callData: abi.encodeWithSelector(
        MinimalAccountEIP7702.execute.selector,
        address(token),
        0,
        abi.encodeWithSelector(token.transfer.selector, receiver, 1e18)
    ),
    paymasterData: abi.encode(poolKey, permitSingle, signature),
    // ... gas configuration
});
```

**Step 3: Paymaster Validation**
1. Paymaster validates permit2 signature
2. Calculates required ETH for gas (prefund + postOp buffer)
3. Executes token→ETH swap via Uniswap pool callback
4. Pulls exact tokens needed from user via permit2
5. Returns validation success

**Step 4: User Operation Execution**
1. Bundler executes user operation
2. Token transfer occurs (1 token to receiver)
3. Paymaster postOp refunds excess ETH to user
4. EntryPoint deposit refilled with actual gas cost

### 6. Economic Benefits Demonstration

**For Liquidity Providers:**
- **Dual Revenue Stream**: Earn from both swaps and sponsorship
- **Increased Capital Efficiency**: Same liquidity serves more users
- **Market-Driven Fees**: Competition between pools drives optimal pricing
- **Permissionless Entry**: Anyone can become an LP

**For Users:**
- **Universal Token Support**: Pay gas with any token in any pool
- **No Native Currency Required**: Complete gas abstraction
- **Competitive Pricing**: Market forces drive down costs
- **Seamless UX**: Single transaction, no manual provider switching

**For the Ecosystem:**
- **Decentralized Infrastructure**: No single point of failure
- **Censorship Resistance**: Permissionless and ungoverned
- **Scalable**: Works with any Uniswap V4 pool
- **Composable**: Integrates with existing DeFi infrastructure

### 7. Advanced Features

**Asymmetric Fee Hook:**
- Reduces fees for token→ETH swaps (sponsorship direction)
- Increases fees for ETH→token swaps (normal trading)
- Optimizes for paymaster usage while maintaining LP profitability

**EntryPoint Vault:**
- ERC-4626-style interface for pooled EntryPoint deposits
- Proportional profit sharing among depositors
- Automatic rebalancing and yield distribution

**Permit2 Integration:**
- Gasless approvals for users without native currency
- Secure, standardized permit mechanism
- Enables true gasless onboarding

### 8. Future Enhancements

**Paymaster Pool Aggregator (WIP):**
- Off-chain service to find optimal paymaster pool
- Route users to lowest-cost sponsorship
- Similar to DEX aggregators but for gas abstraction

**Custom Hooks:**
- Developers can create specialized hooks
- Optimize for specific use cases
- Enhanced fee structures and incentives

---

## Technical Architecture

### Core Components

1. **UniswapPaymaster**: ERC-4337 compliant paymaster
2. **EntryPointVault**: Pooled EntryPoint deposit management
3. **AsymmetricFeeHook**: Directional fee optimization
4. **Permit2**: Gasless approval mechanism

### Key Mechanisms

1. **Just-in-Time Swaps**: Token→ETH conversion during validation
2. **Callback-Based Architecture**: Leverages Uniswap V4's callback system
3. **Proportional Profit Sharing**: Automatic distribution to LPs
4. **Excess Refunding**: Users receive unused ETH back

### Security Considerations

1. **Economic Security**: Users can only be sponsored if they have sufficient tokens
2. **Slippage Protection**: Exact output swaps prevent MEV attacks
3. **Permit Validation**: Secure signature verification
4. **EntryPoint Integration**: Standard ERC-4337 security model

---

## Conclusion

The Paymaster Pools system demonstrates a fundamental shift in gas abstraction:

- **From Centralized to Decentralized**: Permissionless, ungoverned infrastructure
- **From Restricted to Universal**: Any token, any pool, any user
- **From Monopolistic to Competitive**: Market-driven pricing and fee discovery
- **From Inefficient to Optimal**: Dual-purpose liquidity, enhanced capital efficiency

This architecture enables the next generation of decentralized gas abstraction, removing the final barriers to mass adoption of Ethereum applications.

---

## Commands to Run Demo

```bash
# 1. Deploy contracts
forge script script/Deploy.s.sol --rpc-url $RPC_URL --broadcast

# 2. Add liquidity to pool
forge script script/AddLiquidity.s.sol --rpc-url $RPC_URL --broadcast

# 3. Fund EntryPoint vault
forge script script/Deposit.s.sol --rpc-url $RPC_URL --broadcast

# 4. Execute gasless transaction
forge script script/Sponsorship.s.sol --rpc-url $RPC_URL --broadcast
```

**Environment Variables Required:**
- `RPC_URL`: Ethereum RPC endpoint
- `EOA_ADDRESS`: User's EOA address
- `EOA_PRIVATE_KEY`: User's private key
- `BUNDLER_ADDRESS`: Bundler address
- `BUNDLER_PRIVATE_KEY`: Bundler private key
- `LP1_PRIVATE_KEY`: Liquidity provider private key
- `DEPOSITOR_PRIVATE_KEY`: Depositor private key

