// SPDX-License-Identifier: MIT
pragma solidity ^0.7.0;
pragma experimental ABIEncoderV2;

import "../lib/PrismProxy.sol";

interface IVotingPower {

    struct Stake {
        uint256 amount;
        uint256 votingPower;
    }

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
    function getARCHAmountStaked(address staker) external view returns (uint256);
    function getAmountStaked(address staker, address stakedToken) external view returns (uint256);
    function getARCHStake(address staker) external view returns (Stake memory);
    function getStake(address staker, address stakedToken) external view returns (Stake memory);
    function getCurrentVotes(address account) external view returns (uint256);
    function getPriorVotes(address account, uint256 blockNumber) external view returns (uint256);
    event NewPendingImplementation(address indexed oldPendingImplementation, address indexed newPendingImplementation);
    event NewImplementation(address indexed oldImplementation, address indexed newImplementation);
    event NewPendingAdmin(address indexed oldPendingAdmin, address indexed newPendingAdmin);
    event NewAdmin(address indexed oldAdmin, address indexed newAdmin);
    event Staked(address indexed user, address indexed token, uint256 indexed amount, uint256 votingPower);
    event Withdrawn(address indexed user, address indexed token, uint256 indexed amount, uint256 votingPower);
    event VotingPowerChanged(address indexed voter, uint256 indexed previousBalance, uint256 indexed newBalance);
}