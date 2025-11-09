# postOpReverted - CRYSTAL CLEAR EXPLANATION

## The Answer: NO, your postOp is NOT called again

When `mode == postOpReverted`, EntryPoint **SKIPS** calling your `postOp` function.

## Step-by-Step: What Actually Happens

### Scenario: Your postOp reverts

#### Step 1: EntryPoint tries to call your postOp (FIRST TIME)
```solidity
// EntryPoint.sol line 777-786
if (mode != IPaymaster.PostOpMode.postOpReverted) {  // ← mode is opSucceeded or opReverted
    try IPaymaster(paymaster).postOp{gas: ...}(...) {
        // Your postOp succeeded - continue normally
    }
    catch {
        // YOUR POSTOP REVERTED! ← We are here
        bytes memory reason = Exec.getReturnData(...);
        revert PostOpReverted(reason);  // ← Throws error
    }
}
```

**Result:** Your `postOp` reverts → EntryPoint catches it → Throws `PostOpReverted` error

#### Step 2: EntryPoint catches the error
```solidity
// EntryPoint.sol line 240-251
} else {
    // This is the catch block - postOp reverted
    emit PostOpRevertReason(...);  // ← Emit event for debugging
    
    // Call _postExecution AGAIN, but with mode = postOpReverted
    collected = _postExecution(
        IPaymaster.PostOpMode.postOpReverted,  // ← Recovery mode
        opInfo, 
        context, 
        actualGas
    );
}
```

**Result:** EntryPoint calls `_postExecution` again, but this time with `mode = postOpReverted`

#### Step 3: EntryPoint calls _postExecution again (RECOVERY MODE)
```solidity
// EntryPoint.sol line 777-787
if (mode != IPaymaster.PostOpMode.postOpReverted) {  
    // ← mode IS postOpReverted, so this check FAILS
    // ← THIS BLOCK IS SKIPPED
    try IPaymaster(paymaster).postOp{gas: ...}(...) {
        // NOT EXECUTED
    }
    catch {
        // NOT EXECUTED
    }
}
// ← Code continues here WITHOUT calling your postOp
```

**Result:** Your `postOp` is **NOT called** because the `if` check fails

## Visual Flow

```
┌─────────────────────────────────────────┐
│ 1. UserOperation executes              │
│    mode = opSucceeded (or opReverted)  │
└──────────────┬──────────────────────────┘
               │
               ▼
┌─────────────────────────────────────────┐
│ 2. EntryPoint calls _postExecution()    │
│    mode = opSucceeded                   │
└──────────────┬──────────────────────────┘
               │
               ▼
┌─────────────────────────────────────────┐
│ 3. EntryPoint tries: postOp(...)        │
│    ← YOUR POSTOP IS CALLED HERE         │
└──────────────┬──────────────────────────┘
               │
               ▼
        ┌──────────────┐
        │ postOp reverts? │
        └──────┬───────┘
               │
        ┌──────┴───────┐
        │ YES         │ NO
        ▼             ▼
┌───────────────┐  ┌──────────────┐
│ 4. Catch block│  │ Continue     │
│    Emit event │  │ normally     │
│    Throw error│  │              │
└───────┬───────┘  └──────────────┘
        │
        ▼
┌─────────────────────────────────────────┐
│ 5. EntryPoint calls _postExecution()   │
│    AGAIN, but with:                     │
│    mode = postOpReverted                │
└──────────────┬──────────────────────────┘
               │
               ▼
┌─────────────────────────────────────────┐
│ 6. Check: mode != postOpReverted?        │
│    → FALSE (mode IS postOpReverted)     │
│    → SKIP calling postOp                │
│                                          │
│    YOUR POSTOP IS NOT CALLED!           │
└─────────────────────────────────────────┘
```

## The Code That Proves It

Look at line 777 in EntryPoint.sol:

```solidity
if (mode != IPaymaster.PostOpMode.postOpReverted) {
    // Only call postOp if mode is NOT postOpReverted
    try IPaymaster(paymaster).postOp(...) { }
    catch { revert PostOpReverted(...); }
}
// If mode == postOpReverted, this entire block is skipped
```

**Translation:** "If mode is postOpReverted, DON'T call postOp"

## Why This Design?

1. **Prevents infinite loops:** If your postOp reverts, calling it again would just revert again
2. **Ensures UserOperation completes:** EntryPoint needs to finish the UserOperation even if your code fails
3. **Recovery mechanism:** EntryPoint handles the failure gracefully without your help

## What This Means For You

### ❌ WRONG Understanding:
"I need to handle postOpReverted in my postOp function"

### ✅ CORRECT Understanding:
"If my postOp reverts, EntryPoint will handle it. My postOp won't be called again. I should write code that doesn't revert."

## Example

```solidity
function _postOp(PostOpMode mode, ...) internal override {
    // This function is ONLY called when mode is:
    // - opSucceeded
    // - opReverted
    // 
    // It is NEVER called when mode is postOpReverted
    // (because EntryPoint skips calling it)
    
    if (mode == PostOpMode.postOpReverted) {
        // ← This code will NEVER execute
        // EntryPoint won't call your postOp in this mode
    }
    
    // Normal logic here
    if (mode == PostOpMode.opSucceeded) {
        refundUser(excess);
    }
    
    entryPoint().depositTo{value: totalUsed}(address(this));
}
```

## Summary

| Question | Answer |
|----------|--------|
| Is postOp called when mode == postOpReverted? | **NO** - EntryPoint skips calling it |
| Why? | To prevent infinite loops |
| What should I do? | Write code that doesn't revert |
| Can I handle postOpReverted? | No need - EntryPoint handles it automatically |

**Bottom line:** When `mode == postOpReverted`, your `postOp` function is **NOT called**. EntryPoint handles recovery automatically.

