// SPDX-License-Identifier: MIT
pragma solidity ^0.6.12;

interface IVesting {
    function vestedBalance(address account) external view returns (uint256);
} 