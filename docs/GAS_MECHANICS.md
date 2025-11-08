# ERC-4337 Gas Mechanics Reference

## Gas Fields

```solidity
struct UserOperation {
    // VALIDATION PHASE GAS
    uint256 verificationGasLimit;           // Account's validateUserOp() + account creation
    uint256 paymasterVerificationGasLimit;  // Paymaster's validatePaymasterUserOp()
    
    // EXECUTION PHASE GAS
    uint256 callGasLimit;                   // Main execution call to account
    uint256 paymasterPostOpGasLimit;        // Paymaster's postOp() call
    
    // OVERHEAD GAS
    uint256 preVerificationGas;             // Bundler overhead (calldata cost, EntryPoint fixed costs)
    
    // PRICING
    uint256 maxFeePerGas;                   // Max gas price willing to pay (EIP-1559)
    uint256 maxPriorityFeePerGas;           // Max priority fee (tip to bundler)
}
```

## Gas Penalties (10% on Unused Gas > 40k)

### Why Penalties Exist
Prevent griefing attack: UserOp reserves huge gas space in bundle but uses little, blocking other operations.

### Penalty Rules

| Field | Hard Limit Revert | Unused Gas Penalty | Reason |
|-------|-------------------|-------------------|--------|
| `verificationGasLimit` | ✅ AA26 | ❌ No | Bundler simulates and can reject before committing to bundle |
| `paymasterVerificationGasLimit` | ✅ AA36 | ❌ No | Bundler simulates and can reject before committing to bundle |
| `callGasLimit` | ✅ Implicit | ✅ Yes (10%) | Too late to reject after validation passes. Needs economic disincentive |
| `paymasterPostOpGasLimit` | ✅ Implicit | ✅ Yes (10%) | Too late to reject after validation passes. Needs economic disincentive |
| `preVerificationGas` | ❌ No limit | ❌ No | Pre-paid overhead, not a limit |

### Penalty Calculation
```solidity
if (gasLimit - gasUsed >= 40_000) {
    penalty = (gasLimit - gasUsed) * 10%;
    chargedGas = gasUsed + penalty;
}
```

**Example:**
- Specify `callGasLimit = 200,000`
- Actually use `50,000`
- Unused = `150,000 > 40,000`
- Penalty = `150,000 × 10% = 15,000`
- **Charged: 65,000 gas** (50k + 15k penalty)

**Special case:** If `postOp` reverts, full 10% penalty is charged (worst case).

## Paymaster Deposit Check Flow

### When Deposit is Checked
**BEFORE `validatePaymasterUserOp` is called**

### Exact Flow (EntryPoint.sol lines 621-632)

```
1. Calculate requiredPrefund = totalGas × maxFeePerGas
   ↓
2. CHECK: Does paymaster have enough deposit?
   if (!_tryDecrementDeposit(paymaster, requiredPrefund)) {
       revert "AA31 paymaster deposit too low"  ← FAILS HERE
   }
   ↓
3. DECREMENT deposit immediately (locked for this userOp)
   ↓
4. THEN call validatePaymasterUserOp()  ← Your swap happens here
   ↓
5. [Later in postOp] Refund excess to paymaster deposit
```

### Critical Implication for UniswapPaymaster

Your paymaster gets ETH from swap during **step 4** (validation), but EntryPoint requires deposit at **step 2**.

**Solution:** Maintain a buffer deposit in EntryPoint at all times. Refill in `postOp`.

```solidity
// In postOp (line 172):
entryPoint().depositTo{value: totalUsed}(address(this));

// This refills for the NEXT operation, not the current one
```

## Gas Cost Formula

```solidity
// Maximum possible cost (pre-funded):
maxCost = (verificationGasLimit 
         + paymasterVerificationGasLimit
         + callGasLimit
         + paymasterPostOpGasLimit
         + preVerificationGas) 
         × maxFeePerGas

// Actual cost charged (with penalties):
actualCost = (actualGasUsed 
            + callGasLimit_penalty      // if unused > 40k
            + postOpGasLimit_penalty    // if unused > 40k
            ) × actualGasPrice
```

## Best Practices

1. **Validation gas:** Be accurate but don't over-estimate by >25% or bundlers may reject
2. **Execution gas:** Keep tight estimates to avoid 10% penalty on unused portion
3. **Paymaster deposit:** Always maintain buffer >= 10 userOps worth
4. **PostOp gas:** For UniswapPaymaster, recommend ~80k (current 30k is too low)


