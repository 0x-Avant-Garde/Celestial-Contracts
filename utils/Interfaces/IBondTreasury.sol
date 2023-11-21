// SPDX-License-Identifier: MIT
pragma solidity ^0.8.4;

interface IBondTreasury {
    function totalVested() external view returns (uint256);
}
