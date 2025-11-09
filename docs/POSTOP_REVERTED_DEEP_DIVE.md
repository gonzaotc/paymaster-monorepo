# postOpReverted Deep Dive

## TL;DR

`postOpReverted` is **NOT in the ERC-4337 spec** - it's an **implementation detail** added by the EntryPoint team to handle cases where your paymaster's `postOp` function itself reverts. It's a **recovery mechanism** to prevent infinite loops and ensure the UserOperation completes even if your paymaster code fails.

## The Problem It Solves

What happens if your `postOp` function reverts? Without `postOpReverted`, EntryPoint would be stuck:
- Can't retry `postOp` (might revert again)
- Can't skip it (need to finish the UserOperation)
- Can't revert the whole bundle (other UserOps might succeed)

## The Solution: Two-Phase Recovery

EntryPoint uses a **two-phase recovery mechanism**:

### Phase 1: Try postOp (Normal Flow)
```solidity
// EntryPoint.sol line 777-786
if (mode != IPaymaster.PostOpMode.postOpReverted) {
    try IPaymaster(paymaster).postOp{gas: mUserOp.paymasterPostOpGasLimit}(
        mode, context, actualGasCost, gasPrice
    ) {
        // Success! Continue normally
    } catch {
        // postOp reverted! Enter recovery mode
        bytes memory reason = Exec.getReturnData(REVERT_REASON_MAX_LEN);
        revert PostOpReverted(reason);  // Special error
    }
}
```

### Phase 2: Recovery Mode (postOpReverted)
When `PostOpReverted` error is caught, EntryPoint:
1. Emits `PostOpRevertReason` event (for debugging)
2. Calls `_postExecution` again with `mode = postOpReverted`
3. **Skips calling postOp** (line 777 check prevents retry)
4. Charges maximum penalty (10% of postOpGasLimit)
5. Completes the UserOperation

```solidity
// EntryPoint.sol line 240-251
} else {
    // This is the catch block when innerHandleOp fails
    uint256 freePtr = _getFreePtr();
    emit PostOpRevertReason(
        opInfo.userOpHash,
        opInfo.mUserOp.sender,
        opInfo.mUserOp.nonce,
        Exec.getReturnData(REVERT_REASON_MAX_LEN)
    );
    _restoreFreePtr(freePtr);

    uint256 actualGas = preGas - gasleft() + opInfo.preOpGas;
    collected = _postExecution(IPaymaster.PostOpMode.postOpReverted, opInfo, context, actualGas);
}
```

## When Does postOpReverted Happen?

Your `postOp` can revert for several reasons:

### 1. **Out of Gas**
```solidity
function _postOp(...) internal override {
    // Complex operations that exceed paymasterPostOpGasLimit
    for (uint i = 0; i < 1000; i++) {
        // This might exceed gas limit
    }
}
```

### 2. **Transfer Failures**
```solidity
function _postOp(...) internal override {
    // User doesn't have enough tokens
    IERC20(token).transferFrom(user, address(this), amount);  // Reverts!
}
```

### 3. **Logic Errors**
```solidity
function _postOp(...) internal override {
    require(someCondition, "Failed");  // Reverts if condition false
}
```

### 4. **Reentrancy Protection**
```solidity
function _postOp(...) internal override {
    require(!locked, "Reentrant");  // Reverts if locked
    locked = true;
    // ...
}
```

## What Happens in Recovery Mode?

When `mode == postOpReverted`, EntryPoint:

1. **Skips calling postOp** (line 777):
   ```solidity
   if (mode != IPaymaster.PostOpMode.postOpReverted) {
       // Only call postOp if NOT in recovery mode
       try IPaymaster(paymaster).postOp(...) { }
   }
   ```

2. **Charges maximum penalty** (line 789 comment):
   ```solidity
   // note that if postOp is reverted, the maximum penalty 
   // (10% of postOpGasLimit) is charged.
   ```

3. **Handles prefund gracefully** (line 798):
   ```solidity
   if (prefund < actualGasCost) {
       if (mode == IPaymaster.PostOpMode.postOpReverted) {
           // Don't revert - just use all prefund
           actualGasCost = prefund;
           _emitPrefundTooLow(opInfo);
       }
   }
   ```

## What Should Your Paymaster Do?

### Option 1: Handle postOpReverted Explicitly
```solidity
function _postOp(PostOpMode mode, ...) internal override {
    if (mode == PostOpMode.postOpReverted) {
        // Recovery mode - minimal operations only
        // Don't try complex transfers that might fail again
        // Maybe just log or emit event
        emit PostOpFailed(userOpHash);
        return;  // Exit early
    }
    
    // Normal postOp logic
    if (excess > 0 && mode == PostOpMode.opSucceeded) {
        refundUser(excess);
    }
    
    entryPoint().depositTo{value: totalUsed}(address(this));
}
```

### Option 2: Ignore It (EntryPoint Handles It)
```solidity
function _postOp(PostOpMode mode, ...) internal override {
    // EntryPoint won't call this if mode == postOpReverted
    // So you can ignore it - EntryPoint handles recovery
    
    if (excess > 0 && mode == PostOpMode.opSucceeded) {
        refundUser(excess);
    }
    
    entryPoint().depositTo{value: totalUsed}(address(this));
}
```

**Note:** If `mode == postOpReverted`, EntryPoint **won't call your postOp** (line 777 check), so Option 2 is actually what happens by default.

## Why Isn't It in the ERC-4337 Spec?

The ERC-4337 spec only defines:
- `opSucceeded` - User's operation succeeded
- `opReverted` - User's operation reverted

`postOpReverted` is an **implementation detail** added by the EntryPoint team to:
- Handle paymaster failures gracefully
- Prevent infinite loops
- Ensure UserOperations complete even if paymaster code fails

It's not part of the spec because:
1. It's an internal recovery mechanism
2. Paymasters shouldn't rely on it (they should write correct code)
3. It's an implementation detail, not a protocol requirement

## Key Takeaways

1. **`postOpReverted` is a recovery mode** - EntryPoint uses it when your `postOp` reverts
2. **EntryPoint won't call your postOp** if `mode == postOpReverted` (prevents infinite loop)
3. **Maximum penalty is charged** (10% of postOpGasLimit) when postOp reverts
4. **You don't need to handle it** - EntryPoint handles recovery, but you can if you want
5. **Prevent it** - Write robust `postOp` code that won't revert:
   - Use `try/catch` for external calls
   - Check balances before transfers
   - Keep gas usage low
   - Test edge cases

## Prevention Checklist

✅ **Use try/catch for external calls:**
```solidity
try IERC20(token).transfer(user, amount) {
    // Success
} catch {
    // Handle failure gracefully
}
```

✅ **Check balances before operations:**
```solidity
require(IERC20(token).balanceOf(address(this)) >= amount, "Insufficient");
```

✅ **Keep gas usage predictable:**
```solidity
// Avoid loops with unknown bounds
// Use fixed gas estimates
```

✅ **Test edge cases:**
- What if user has no tokens?
- What if contract has no ETH?
- What if external call reverts?

## Example: Robust postOp

```solidity
function _postOp(PostOpMode mode, bytes calldata context, ...) internal override {
    // Decode context
    (address user, uint256 prefund) = abi.decode(context, (address, uint256));
    
    // Calculate actual cost
    uint256 actualCost = calculateActualCost(...);
    uint256 excess = prefund - actualCost;
    
    // Only refund on success
    if (mode == PostOpMode.opSucceeded && excess > 0) {
        // Use try/catch to prevent reverts
        try this._refundUser(user, excess) {
            // Success
        } catch {
            // Refund failed - log but don't revert
            emit RefundFailed(user, excess);
        }
    }
    
    // Always refill deposit (critical!)
    // Use try/catch here too if needed
    try entryPoint().depositTo{value: actualCost}(address(this)) {
        // Success
    } catch {
        // This is bad - but EntryPoint will handle it
        emit DepositRefillFailed(actualCost);
    }
}
```

## Summary

`postOpReverted` is EntryPoint's way of saying: "Your postOp failed, but I'm going to complete this UserOperation anyway." It's a safety net, not something to rely on. Write robust code that won't revert, and you'll never see this mode.

