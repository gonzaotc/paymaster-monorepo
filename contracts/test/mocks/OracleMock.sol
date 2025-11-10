// SPDX-License-Identifier: GPL-3.0
pragma solidity ^0.8.26;

import {IOracle} from "../../src/IOracle.sol";
import {console} from "forge-std/console.sol";

contract OracleMock is IOracle {
    uint256 private _tokenPriceInEth;

    constructor(uint256 tokenPriceInEth) {
        _tokenPriceInEth = tokenPriceInEth;
    }

    function getTokenPriceInEth() external view returns (uint256 price) {
        return _tokenPriceInEth;
    }
}
