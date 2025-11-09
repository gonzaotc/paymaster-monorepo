# PostOpMode Explained

## What is PostOpMode?

`PostOpMode` is an enum that tells your paymaster **what happened** during the UserOperation execution. It's crucial for implementing correct refund and cleanup logic.

## The Three Modes

### 1. `opSucceeded` ✅
**When:** The user's `callData` executed successfully (or was empty)

**What it means:**
- The UserOperation completed as intended
- The paymaster should pay for gas
- **You can safely refund excess tokens/ETH to the user**

**Example use case:**
```solidity
if (mode == PostOpMode.opSucceeded) {
    // Refund excess tokens to user
    IERC20(token).safeTransfer(user, excessAmount);
}
```

### 2. `opReverted` ❌
**When:** The user's `callData` reverted (failed)

**What it means:**
- The user's transaction failed
- **BUT the paymaster still has to pay for gas** (this is by design!)
- The EntryPoint already charged the paymaster's deposit
- **EntryPoint refunds excess to the paymaster** (not the user)

**Important:** EntryPoint refunds excess gas to the **paymaster**, not the user. The paymaster then decides whether to forward it to the user.

**Why paymasters still pay:**
- Prevents griefing attacks where users could spam failed transactions
- Gas was consumed during validation and execution attempts
- EntryPoint already deducted from paymaster deposit

**Should you refund the user on revert?**
This is a **design choice**, not a hard requirement. Here's the flow:

1. User pre-pays tokens/ETH for MAXIMUM gas cost
2. EntryPoint deducts MAXIMUM from paymaster deposit
3. User's transaction executes (and reverts)
4. EntryPoint calculates actual gas cost (less than maximum)
5. EntryPoint refunds excess to **paymaster's deposit** (line 810 in EntryPoint.sol)
6. Paymaster decides: refund user or keep excess?

**Arguments FOR refunding on revert:**
- ✅ User overpaid - they should get excess back
- ✅ Fair: Gas was consumed, but they overpaid
- ✅ Better UX: Users get their money back

**Arguments AGAINST refunding on revert:**
- ⚠️ User's operation failed - maybe they don't "deserve" a refund
- ⚠️ Could create reentrancy concerns if refund triggers callbacks
- ⚠️ Keeps excess as a "fee" for failed operations (economic incentive)

**Example - Refunding on revert (user-friendly):**
```solidity
if (mode == PostOpMode.opReverted && excess > 0) {
    // Refund excess - user overpaid
    refundUser(excess);
}
```

**Example - Not refunding on revert (keep as fee):**
```solidity
if (mode == PostOpMode.opReverted) {
    // Don't refund - keep excess as fee for failed operation
    // Paymaster keeps the excess in their EntryPoint deposit
}
```

### 3. `postOpReverted` ⚠️
**When:** Your paymaster's `postOp` function itself reverted

**Important:** `postOpReverted` is **NOT in the ERC-4337 spec** - it's an implementation detail added by the EntryPoint team for recovery.

**What it means:**
- Something went wrong in YOUR paymaster code
- EntryPoint caught the revert and handles it gracefully
- Maximum penalty (10% of postOpGasLimit) is charged
- This is a **recovery mode** - EntryPoint won't call postOp again (prevents infinite loop)

**When this happens:**
- Your postOp runs out of gas
- Your postOp reverts (e.g., transfer fails, insufficient balance)
- Your postOp has a bug

**Important:** If `mode == postOpReverted`, EntryPoint **won't call your postOp function** (see EntryPoint.sol line 777). This prevents infinite loops.

**What you should do:**
- **Nothing!** EntryPoint handles recovery automatically
- Your `postOp` won't be called in this mode anyway
- Focus on preventing reverts in the first place (use try/catch, check balances, etc.)

**See `docs/POSTOP_REVERTED_DEEP_DIVE.md` for complete details.**

## Flow Diagram

```
UserOperation Execution Flow:
┌─────────────────────────────────────┐
│ 1. validatePaymasterUserOp()       │
│    - Pre-charge user (if needed)   │
│    - Return context                 │
└──────────────┬──────────────────────┘
               │
               ▼
┌─────────────────────────────────────┐
│ 2. Execute user's callData          │
│    - Success? → mode = opSucceeded  │
│    - Revert?  → mode = opReverted   │
└──────────────┬──────────────────────┘
               │
               ▼
┌─────────────────────────────────────┐
│ 3. Call paymaster.postOp()          │
│    - Try: postOp(mode, ...)         │
│    - Success? → Continue            │
│    - Revert?  → mode = postOpReverted│
│                 (recovery mode)     │
└─────────────────────────────────────┘
```

## Key Considerations for Your Paymaster

### 1. **Refund Logic**
```solidity
function _postOp(PostOpMode mode, bytes calldata context, ...) internal override {
    // Only refund if operation succeeded
    if (mode == PostOpMode.opSucceeded && excess > 0) {
        // Safe to refund user
        refundUser(excess);
    }
    // If opReverted: user failed, don't refund
    // If postOpReverted: we're in recovery, be careful
}
```

### 2. **Always Refill EntryPoint Deposit**
```solidity
// Always refill deposit with actual gas cost
// This is needed for the NEXT operation
entryPoint().depositTo{value: actualGasCost}(address(this));
```

### 3. **Handle postOpReverted Gracefully**
```solidity
if (mode == PostOpMode.postOpReverted) {
    // Minimal operations only
    // Don't try complex transfers that might fail again
    // Maybe just log or emit event
}
```

### 4. **Gas Penalties**
- If `postOp` reverts, EntryPoint charges **maximum penalty** (10% of `postOpGasLimit`)
- This prevents paymasters from reverting to avoid penalties
- Always ensure your `postOp` has enough gas and won't revert

## Real-World Example: UniswapPaymaster

Looking at your `UniswapPaymaster.sol`:

```solidity
function _postOp(PostOpMode mode, bytes calldata context, ...) internal override {
    (address userOpSender, uint256 prefundRequired) = abi.decode(context, ...);
    
    uint256 totalUsed = _ethCost(actualGasCost, actualUserOpFeePerGas);
    uint256 excess = prefundRequired - totalUsed;
    
    // ✅ CORRECT: Only refund if operation succeeded
    if (excess > 0 && mode == PostOpMode.opSucceeded) {
        payable(userOpSender).call{value: excess}("");
    }
    
    // ✅ CORRECT: Always refill deposit
    entryPoint().depositTo{value: totalUsed}(address(this));
}
```

**Why this approach:**
- Refunds only when `opSucceeded` - keeps excess as "fee" for failed operations
- Always refills deposit - ensures next operation can proceed
- Doesn't handle `postOpReverted` explicitly - EntryPoint handles it

**Alternative approach (more user-friendly):**
```solidity
// Refund on both success AND revert
if (excess > 0) {
    if (mode == PostOpMode.opSucceeded || mode == PostOpMode.opReverted) {
        refundUser(excess);  // User gets excess back regardless
    }
}
// Always refill deposit
entryPoint().depositTo{value: totalUsed}(address(this));
```

Both approaches are valid - choose based on your paymaster's economics and UX goals.

## Common Mistakes

### ⚠️ Not a Mistake: Refunding on opReverted
```solidity
// This is actually FINE - it's a design choice!
if (excess > 0 && mode == PostOpMode.opReverted) {
    refundUser(excess);  // User-friendly: refund even on failure
}
```

**Note:** The comment in `UniswapPaymaster.sol` says "prevent economic attacks" but this is likely overly cautious. Refunding on revert is generally safe and user-friendly.

### ❌ Mistake 2: Not refilling EntryPoint deposit
```solidity
// WRONG! Next operation will fail
function _postOp(...) {
    // Forgot to refill deposit
}
```

### ❌ Mistake 3: Complex logic in postOpReverted
```solidity
// WRONG! Might fail again
if (mode == PostOpMode.postOpReverted) {
    complexTransfer();  // Could revert again!
}
```

## The Actual Refund Flow

Here's what happens step-by-step:

```
1. validatePaymasterUserOp()
   ├─ User pre-pays: 100 tokens (for MAX gas cost)
   ├─ EntryPoint deducts: 100 tokens worth of ETH from paymaster deposit
   └─ Returns context with prefund = 100 tokens

2. User's callData executes
   ├─ Success? → mode = opSucceeded
   └─ Revert?  → mode = opReverted

3. EntryPoint calculates actual cost
   ├─ Actual gas used: 50 tokens worth
   └─ Excess: 100 - 50 = 50 tokens

4. EntryPoint refunds excess to paymaster deposit
   └─ Paymaster's EntryPoint deposit += 50 tokens worth of ETH

5. postOp() is called
   └─ Paymaster decides: refund 50 tokens to user or keep them?
```

**Key Point:** EntryPoint always refunds excess to the **paymaster's deposit**. The paymaster then decides whether to forward it to the user.

## Summary

| Mode | User Op Status | Paymaster Pays? | EntryPoint Refunds To | Should You Refund User? | In ERC-4337 Spec? |
|------|---------------|-----------------|----------------------|------------------------|-------------------|
| `opSucceeded` | ✅ Success | ✅ Yes | Paymaster deposit | ✅ **Yes** - User overpaid, refund excess | ✅ Yes |
| `opReverted` | ❌ Failed | ✅ Yes | Paymaster deposit | ⚠️ **Design choice** - Can refund or keep as fee | ✅ Yes |
| `postOpReverted` | ⚠️ Unknown | ✅ Yes | Paymaster deposit | ⚠️ **N/A** - EntryPoint won't call your postOp | ❌ **No** - Implementation detail |

**Key Takeaway:** 
- EntryPoint **always** refunds excess to paymaster deposit
- Refunding users on `opReverted` is a **design choice**, not a requirement
- Most paymasters refund on success, but whether to refund on revert is up to you
- Consider UX (user-friendly) vs economics (keep as fee) when deciding
- `postOpReverted` is **not in the ERC-4337 spec** - it's an EntryPoint implementation detail for recovery. If your `postOp` reverts, EntryPoint handles it automatically and won't call your `postOp` again (prevents infinite loops). Focus on writing robust code that won't revert.

