// SPDX-License-Identifier: MIT
pragma solidity ^0.7.0;

interface IVesting {
    function vestedBalance(address account) external view returns (uint256);
} 