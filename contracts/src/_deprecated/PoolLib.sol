// SPDX-License-Identifier: GPL-3.0
pragma solidity ^0.8.26;

/// @NOTE: Unused for now.

type PoolId is bytes32;

using PoolLib for PoolKey global;

/// @notice Returns the key for identifying a pool
struct PoolKey {
    /// @notice The lower currency of the pool, sorted numerically
    address token;
    // the oracle for the token
    address oracle;
    // the LP fee expressed in basis points (bps)
    uint24 lpFeeBps;
    // the rebalancing fee expressed in basis points (bps)
    uint24 rebalancingFeeBps;
}

library PoolLib {
    /// @notice Returns value equal to keccak256(abi.encode(poolKey))
    function toId(PoolKey memory poolKey) internal pure returns (PoolId poolId) {
        assembly ("memory-safe") {
            // 0x80 represents the total size of the poolKey struct (4 slots of 32 bytes)
            // Layout: token (32 bytes) + oracle (32 bytes) + lpFeeBps (32 bytes) + rebalancingFeeBps (32 bytes)
            poolId := keccak256(poolKey, 0x80)
        }
    }
}
