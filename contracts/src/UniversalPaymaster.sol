// SPDX-License-Identifier: MIT
pragma solidity ^0.8.26;

// External
import {
    ERC4337Utils,
    PackedUserOperation
} from "@openzeppelin/contracts/account/utils/draft-ERC4337Utils.sol";
import {IEntryPoint} from "@openzeppelin/contracts/interfaces/draft-IERC4337.sol";
// Internal
import {MinimalPaymasterCore} from "./MinimalPaymasterCore.sol";
import {ERC6909NativeEntryPointVault} from "./ERC6909NativeEntryPointVault.sol";

contract UniversalPaymaster is MinimalPaymasterCore, ERC6909NativeEntryPointVault {
    using ERC4337Utils for PackedUserOperation;

    // returns the entry point defined by the `MinimalPaymasterCore` contract.
    function entryPoint() public view virtual override(MinimalPaymasterCore, ERC6909NativeEntryPointVault) returns (IEntryPoint) {
        return super.entryPoint();
    }

    function _validatePaymasterUserOp(
        PackedUserOperation calldata userOp,
        bytes32,
        uint256 maxCost
    ) internal virtual override returns (bytes memory context, uint256 validationData) {

        // 1. query the token price from oracle

        // 2. convert from gas amount to token amount

        // 2. calculate the current fee %, which is a relationship between the token reserves and the eth reserves.

        // 2. take pre-payment from the user, using approval, or permit1, or permit2.
    }

    function _postOp(
        PostOpMode mode,
        bytes calldata context,
        uint256 actualGasCost,
        uint256 actualUserOpFeePerGas
    ) internal virtual override {

        // 1. convert from gas amount to token amount

        // 2. transfer the excess token amount to the user
    }

    function rebalance(address token) public {
        // 1. query the token price from oracle

        // 2. calculate the current fee %, which is a relationship between the token reserves and the eth reserves.

        // allow buying

    }
}
