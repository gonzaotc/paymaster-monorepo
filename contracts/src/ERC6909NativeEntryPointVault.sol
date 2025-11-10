// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import {
    ERC6909TokenSupply
} from "@openzeppelin/contracts/token/ERC6909/extensions/ERC6909TokenSupply.sol";
import {Math} from "@openzeppelin/contracts/utils/math/Math.sol";
import {IEntryPoint} from "@openzeppelin/contracts/interfaces/draft-IERC4337.sol";
import {ERC4337Utils} from "@openzeppelin/contracts/account/utils/draft-ERC4337Utils.sol";
// test
import {console} from "forge-std/console.sol";

abstract contract ERC6909NativeEntryPointVault is ERC6909TokenSupply {
    using Math for uint256;

    // total amount of ETH for a particular ID token.
    mapping(uint256 id => uint256) private _assets;

    event Deposit(
        address indexed caller, address indexed receiver, uint256 assets, uint256 shares, uint256 id
    );

    event Withdraw(
        address indexed caller,
        address indexed receiver,
        address indexed owner,
        uint256 assets,
        uint256 shares,
        uint256 id
    );

    error ERC6909NativeVaultExceededMaxDeposit(
        address receiver, uint256 assets, uint256 max, uint256 id
    );

    error ERC6909NativeVaultExceededMaxMint(
        address receiver, uint256 shares, uint256 max, uint256 id
    );

    error ERC6909NativeVaultExceededMaxWithdraw(
        address owner, uint256 assets, uint256 max, uint256 id
    );

    error ERC6909NativeVaultExceededMaxRedeem(
        address owner, uint256 shares, uint256 max, uint256 id
    );

    error ERC6909NativeVaultInvalidNativeAmount(uint256 assets, uint256 value);

    error ERC6909NativeVaultWithdrawFailed(address receiver, uint256 assets);

    function entryPoint() public view virtual returns (IEntryPoint);

    /**
     * @dev Returns the total amount of ETH assets for a particular token ID pool.
     */
    function totalAssets(uint256 id) public view virtual returns (uint256) {
        return _assets[id];
    }

    function maxDeposit(
        address,
        /* receiver */
        uint256 id
    )
        public
        view
        virtual
        returns (uint256)
    {
        return type(uint256).max;
    }

    function maxMint(
        address,
        /* receiver */
        uint256 id
    )
        public
        view
        virtual
        returns (uint256)
    {
        return type(uint256).max;
    }

    function maxWithdraw(address owner, uint256 id) public view virtual returns (uint256) {
        return previewRedeem(maxRedeem(owner, id), id);
    }

    function maxRedeem(address owner, uint256 id) public view virtual returns (uint256) {
        return balanceOf(owner, id);
    }

    function previewDeposit(uint256 assets, uint256 id) public view virtual returns (uint256) {
        return _convertToShares(assets, id, Math.Rounding.Floor);
    }

    function previewMint(uint256 shares, uint256 id) public view virtual returns (uint256) {
        return _convertToAssets(shares, id, Math.Rounding.Ceil);
    }

    function previewWithdraw(uint256 assets, uint256 id) public view virtual returns (uint256) {
        return _convertToShares(assets, id, Math.Rounding.Ceil);
    }

    function previewRedeem(uint256 shares, uint256 id) public view virtual returns (uint256) {
        return _convertToAssets(shares, id, Math.Rounding.Floor);
    }

    function deposit(uint256 assets, address receiver, uint256 id)
        public
        payable
        virtual
        returns (uint256)
    {
        if (assets != msg.value) {
            revert ERC6909NativeVaultInvalidNativeAmount(assets, msg.value);
        }

        uint256 maxAssets = maxDeposit(receiver, id);
        if (assets > maxAssets) {
            revert ERC6909NativeVaultExceededMaxDeposit(receiver, assets, maxAssets, id);
        }

        uint256 shares = previewDeposit(assets, id);
        _deposit(_msgSender(), receiver, assets, shares, id);

        return shares;
    }

    function withdraw(uint256 assets, address receiver, address owner, uint256 id)
        public
        virtual
        returns (uint256)
    {
        uint256 maxAssets = maxWithdraw(owner, id);
        if (assets > maxAssets) {
            revert ERC6909NativeVaultExceededMaxWithdraw(owner, assets, maxAssets, id);
        }

        uint256 shares = previewWithdraw(assets, id);
        _withdraw(_msgSender(), receiver, owner, assets, shares, id);

        return shares;
    }

    /**
     * @dev Internal conversion function (from assets to shares) with support for rounding direction.
     *
     * NOTE: Uses virtual shares (1 wei) to mitigate inflation attacks on empty pools.
     * This follows the ERC4626 pattern but simplified for native ETH vaults.
     */
    function _convertToShares(uint256 assets, uint256 id, Math.Rounding rounding)
        internal
        view
        virtual
        returns (uint256)
    {
        return assets.mulDiv(totalSupply(id) + 1, totalAssets(id) + 1, rounding);
    }

    /**
     * @dev Internal conversion function (from shares to assets) with support for rounding direction.
     *
     * NOTE: Uses virtual shares (1 wei) to mitigate inflation attacks on empty pools.
     */
    function _convertToAssets(uint256 shares, uint256 id, Math.Rounding rounding)
        internal
        view
        virtual
        returns (uint256)
    {
        return shares.mulDiv(totalAssets(id) + 1, totalSupply(id) + 1, rounding);
    }

    /**
     * @dev Deposit/mint common workflow.
     *
     * NOTE: ETH is already received via `msg.value` in `deposit`, so we only need to track it.
     */
    function _deposit(address caller, address receiver, uint256 assets, uint256 shares, uint256 id)
        internal
        virtual
    {
        _increaseAssets(id, assets);
        _mint(receiver, id, shares);
        entryPoint().depositTo{value: assets}(address(this));

        emit Deposit(caller, receiver, assets, shares, id);
    }

    /**
     * @dev Withdraw/redeem common workflow.
     *
     * NOTE: Updates asset tracking before sending ETH to prevent reentrancy issues.
     */
    function _withdraw(
        address caller,
        address receiver,
        address owner,
        uint256 assets,
        uint256 shares,
        uint256 id
    ) internal virtual {
        if (caller != owner) {
            _spendAllowance(owner, caller, id, shares);
        }

        _burn(owner, id, shares);
        _decreaseAssets(id, assets);
        entryPoint().withdrawTo(payable(receiver), assets);

        emit Withdraw(caller, receiver, owner, assets, shares, id);
    }

    function _increaseAssets(uint256 id, uint256 amount) internal virtual {
        _assets[id] += amount;
    }

    function _decreaseAssets(uint256 id, uint256 amount) internal virtual {
        _assets[id] -= amount;
    }
}
