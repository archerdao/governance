// SPDX-License-Identifier: MIT
pragma solidity ^0.7.0;
pragma experimental ABIEncoderV2;

import "../lib/PrismProxy.sol";

interface IVotingPower {
    function setPendingProxyImplementation(address newPendingImplementation) external returns (bool);
    function acceptProxyImplementation() external returns (bool);
    function setPendingProxyAdmin(address newPendingAdmin) external returns (bool);
    function acceptProxyAdmin() external returns (bool);
    function proxyAdmin() external view returns (address);
    function pendingProxyAdmin() external view returns (address);
    function proxyImplementation() external view returns (address);
    function pendingProxyImplementation() external view returns (address);
    function proxyImplementationVersion() external view returns (uint8);
    function become(PrismProxy prism) external;
    function initialize(address _archToken, address _vestingContract) external;
    function archToken() external view returns (address);
    function vestingContract() external view returns (address);
    function stake(uint256 amount) external;
    function stakeWithPermit(uint256 amount, uint256 deadline, uint8 v, bytes32 r, bytes32 s) external;
    function withdraw(uint256 amount) external;
    function addVotingPowerForVestingTokens(address account, uint256 amount) external;
    function removeVotingPowerForClaimedTokens(address account, uint256 amount) external;
    function totalARCHStaked() external view returns (uint256);
    function totalStaked(address stakedToken) external view returns (uint256);
    function getCurrentVotes(address account) external view returns (uint256);
    function getPriorVotes(address account, uint256 blockNumber) external view returns (uint256);
    event NewPendingImplementation(address oldPendingImplementation, address newPendingImplementation);
    event NewImplementation(address oldImplementation, address newImplementation);
    event NewPendingAdmin(address oldPendingAdmin, address newPendingAdmin);
    event NewAdmin(address oldAdmin, address newAdmin);
    event Staked(address indexed user, address token, uint256 amount);
    event Withdrawn(address indexed user, address token, uint256 amount);
    event VotingPowerChanged(address indexed voter, uint256 previousBalance, uint256 newBalance);
}