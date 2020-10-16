// SPDX-License-Identifier: MIT
pragma solidity ^0.6.12;

interface IVotingPower {
    function stake(uint256 amount) external;
    function stakeWithPermit(uint256 amount, uint deadline, uint8 v, bytes32 r, bytes32 s) external;
    function withdraw(uint256 amount) external;
    function addVotingPowerForVestingTokens(address account, uint256 amount) external;
    function removeVotingPowerForClaimedVestingTokens(address account, uint256 amount) external;
} 