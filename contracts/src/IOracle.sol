// SPDX-License-Identifier: GPL-3.0
pragma solidity ^0.8.12;

interface IOracle {
    // returns the price of the token in ETH
    function getTokenPriceInEth() external view returns (uint256 price);
}
