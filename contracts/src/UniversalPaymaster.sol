// SPDX-License-Identifier: GPL-3.0
pragma solidity ^0.8.26;

// External
import {ERC4337Utils, PackedUserOperation} from "@openzeppelin/contracts/account/utils/draft-ERC4337Utils.sol";
import {IEntryPoint} from "@openzeppelin/contracts/interfaces/draft-IERC4337.sol";
import {IERC20} from "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import {SafeERC20} from "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";
import {Math} from "@openzeppelin/contracts/utils/math/Math.sol";
// Internal
import {MinimalPaymasterCore} from "./MinimalPaymasterCore.sol";
import {ERC6909NativeEntryPointVault} from "./ERC6909NativeEntryPointVault.sol";
import {IOracle} from "./IOracle.sol";

contract UniversalPaymaster is MinimalPaymasterCore, ERC6909NativeEntryPointVault {
    using ERC4337Utils for PackedUserOperation;
    using SafeERC20 for IERC20;
    using Math for *;

    // emitted when a new pool is initialized
    event PoolInitialized(address token, address oracle);

    // emitted when a pool is rebalanced
    event PoolRebalanced(address token, uint256 ethAmount, uint256 tokenAmount);

    // thrown when a pool is already initialized
    error PoolAlreadyInitialized(address token);

    // thrown when a pool is not initialized
    error PoolNotInitialized(address token);

    // thrown when a pool does not have enough eth reserves
    error PoolNotEnoughEthReserves(address token);

    // thrown when a pool does not have enough token reserves
    error PoolNotEnoughTokenReserves(address token);

    // thrown when an invalid oracle is provided
    error InvalidOracle(address oracle);

    // thrown when not enough eth is sent
    error NotEnoughEthSent(address token);

    // mapping of token to oracle
    mapping(address token => IOracle oracle) oracles;

    // initializes a new pool for a given token and oracle
    // NOTE: In the current version, only one pool can be initialized for a given token.
    function initializePool(address token, address oracle) public {
        require(oracles[token] == IOracle(address(0)), PoolAlreadyInitialized(token));
        require(oracle != address(0), InvalidOracle(oracle));
        oracles[token] = IOracle(oracle);

        emit PoolInitialized(token, oracle);
    }

    function _validatePaymasterUserOp(PackedUserOperation calldata userOp, bytes32, uint256 maxCost)
        internal
        virtual
        override
        returns (bytes memory context, uint256 validationData)
    {
        // 1. decode the token from the paymaster data
        (address token) = abi.decode(userOp.paymasterData(), (address));

        // 2. verify the pool is initialized
        IOracle oracle = oracles[token];
        require(address(oracle) != address(0), PoolNotInitialized(token));

        // 3. verify the pool has enough eth reserves
        require(getPoolEthReserves(token) >= maxCost, PoolNotEnoughEthReserves(token));

        // 4. query the token price from oracle
        uint256 tokenPriceInEth = oracle.getTokenPriceInEth();

        // 5. query the fees in basis points for the token pool
        uint24 feesBps = getPoolFeesBps(token);

        // 6. calculate the prefund amount
        uint256 prefund = _erc20Cost(maxCost, userOp.maxFeePerGas(), tokenPriceInEth, feesBps);

        // 7. attempt to transfer the prefund amount from the user to the paymaster
        bool prefunded = IERC20(token).trySafeTransferFrom(userOp.sender, address(this), prefund);

        // 8. if the prefund payment failed, fail the validation
        if (!prefunded) return (bytes(""), ERC4337Utils.SIG_VALIDATION_FAILED);

        // 9. encode the context for the `postOp` function
        context = abi.encode(userOp.sender, token, tokenPriceInEth, feesBps, prefund);

        return (context, validationData);
    }

    function _postOp(PostOpMode, bytes calldata context, uint256 actualGasCost, uint256 actualUserOpFeePerGas)
        internal
        virtual
        override
    {
        // 1. decode the context for the `postOp` function
        (address sender, address token, uint256 tokenPriceInEth, uint256 feesBps, uint256 prefund) =
            abi.decode(context, (address, address, uint256, uint256, uint256));

        // 2. convert from gas amount to token amount
        uint256 actualTokenAmount = _erc20Cost(actualGasCost, actualUserOpFeePerGas, tokenPriceInEth, feesBps);

        // 2. transfer the excess token amount to the user
        uint256 excessTokenAmount = prefund - actualTokenAmount;

        // @tbd optional optimization: only send the excess if its value is larger than the cost of sending them
        if (excessTokenAmount > 0) IERC20(token).safeTransfer(sender, excessTokenAmount);
    }

    /// @dev Calculates the cost of the user operation in ETH.
    /// @param cost The cost of the user operation in ETH.
    /// @param feePerGas The fee per gas of the user operation.
    /// @param tokenPrice The price of the token in ETH.
    /// @param feesBps The fees in basis points. i.e 100bps = 1%
    /// @return erc20Cost The cost of the user operation in the token.
    function _erc20Cost(uint256 cost, uint256 feePerGas, uint256 tokenPrice, uint256 feesBps)
        internal
        view
        virtual
        returns (uint256 erc20Cost)
    {
        uint256 baseCost = (cost + _postOpCost() * feePerGas).mulDiv(tokenPrice, _tokenPriceDenominator());
        erc20Cost = baseCost + (baseCost * feesBps / 10000);
    }

    /// @dev Denominator used for interpreting the `tokenPrice` returned by {_fetchDetails} as "fixed point" in {_erc20Cost}.
    function _tokenPriceDenominator() internal view virtual returns (uint256) {
        return 1e18;
    }

    /// @dev Over-estimates the cost of the post-operation logic
    function _postOpCost() internal pure returns (uint256) {
        return 30_000;
    }

    // allows anyone to rebalance the pool by buying tokens for eth at a discount price, 
    // an economic incentive paid by the users to the rebalancers.
    function rebalance(address token, uint256 tokenAmount, address receiver) payable public returns (uint256 ethAmountAfterDiscount) {
        // 1. get the oracle and validate the pool exists
        IOracle oracle = oracles[token];
        require(address(oracle) != address(0), PoolNotInitialized(token));

        // 2. validate the pool has enough tokenAmount to sell 
        require(getPoolTokenReserves(token) >= tokenAmount, PoolNotEnoughTokenReserves(token));

        // 3. query the token price from oracle
        uint256 tokenPriceInEth = oracle.getTokenPriceInEth();

        // 4. calculate the eth amount for buying the token amount
        uint256 ethAmount = tokenAmount * tokenPriceInEth;

        // 5. get the rebalancing discount in basis points
        uint256 rebalancingDiscountBps = getRebalancingFee(token);

        // 6. calculate the eth amount after the rebalancing discount
        ethAmountAfterDiscount = ethAmount - (ethAmount * rebalancingDiscountBps / 10000);

        // 7. validate the eth amount after the rebalancing discount is greater than the msg.value
        require(ethAmountAfterDiscount >= msg.value, NotEnoughEthSent(token));

        // 8. send the bought tokens to the receiver
        IERC20(token).safeTransferFrom(address(this), receiver, tokenAmount);

        // 9. send back any excess eth to the receiver
        payable(receiver).transfer(msg.value - ethAmountAfterDiscount);

        emit PoolRebalanced(token, ethAmountAfterDiscount, tokenAmount);
    }

    // returns the current eth reserves for a given token pool
    function getPoolEthReserves(address token) public view returns (uint256 ethReserves) {
        return totalAssets(uint256(uint160(token)));
    }

    // returns the current token reserves for a given token pool
    function getPoolTokenReserves(address token) public view returns (uint256 tokenReserves) {
        return IERC20(token).balanceOf(address(this));
    }

    // returns the current fees in basis points for a given token pool
    function getPoolFeesBps(address token) public pure returns (uint24 feesBps) {
        return getRebalancingFee(token) + getLPFee(token);
    }

    // the pool fee is expressed in basis points (bps)
    // i.e: 190 bps = 1.90%
    //
    // to be done: the pool fee should be a relationship between the token reserves and the eth reserves.
    // A kind of bounding curve must be implemented where:
    // When ethReserves are zero, the fee is maximum (e.g 5%)
    // When tokenReserves are zero, the fee is minimum (e.g 0.1%)
    //
    function getRebalancingFee(address token) public pure returns (uint24 feeBps) {
        return 190;
    }

    // the pool LP fee is expressed in basis points (bps)
    // i.e: 100 bps = 1%
    //
    function getLPFee(address token) public pure returns (uint24 feeBps) {
        return 100;
    }

    // required override by Solidity
    // returns the entryPoint defined by the `MinimalPaymasterCore` contract.
    function entryPoint()
        public
        view
        virtual
        override(MinimalPaymasterCore, ERC6909NativeEntryPointVault)
        returns (IEntryPoint)
    {
        return super.entryPoint();
    }
}
