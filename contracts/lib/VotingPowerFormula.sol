// SPDX-License-Identifier: MIT
pragma solidity ^0.7.0;

abstract contract VotingPowerFormula {
   function convertTokensToVotingPower(uint256 amount) external view virtual returns (uint256);
}