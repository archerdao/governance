// SPDX-License-Identifier: MIT
pragma solidity ^0.6.12;
pragma experimental ABIEncoderV2;

import "../interfaces/IArchToken.sol";
import "../interfaces/IVesting.sol";

/// @notice A checkpoint for marking number of votes from a given block
struct Checkpoint {
    uint32 fromBlock;
    uint256 votes;
}

struct VotingPowerStorage {
    /// @notice Voting Power contract version
    uint8 public version;

    /// @notice ARCH token
    IArchToken public archToken;

    /// @notice Vesting contract
    IVesting public vesting;

    /// @notice Total amount staked in the VotingPower contract
    uint256 public totalStaked;

    /// @dev Official record of staked balances for each account
    mapping (address => uint256) internal stakes;

    /// @notice A record of votes checkpoints for each account, by index
    mapping (address => mapping (uint32 => Checkpoint)) public checkpoints;

    /// @notice The number of checkpoints for each account
    mapping (address => uint32) public numCheckpoints;

    /// @notice A record of states for signing / validating signatures
    mapping (address => uint) public nonces;
}

library AppStorage {
    bytes32 constant VOTING_POWER_STORAGE_POSITION = keccak256("voting.power.storage");
    
    function votingPowerStorage() internal pure returns (VotingPowerStorage storage vps) {        
        bytes32 position = VOTING_POWER_STORAGE_POSITION;
        assembly {
            vps.slot := position
        }
    }
}