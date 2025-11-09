// SPDX-License-Identifier: GPL-3.0
pragma solidity ^0.8.12;

interface IOracle {
    function getTokenPriceInEth() external view returns (uint256 price);
}
