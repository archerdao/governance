// SPDX-License-Identifier: MIT
pragma solidity ^0.7.0;
pragma experimental ABIEncoderV2;

import "../interfaces/IArchToken.sol";
import "../interfaces/IVesting.sol";

/// @notice App metadata storage
struct AppStorage {
    // A record of states for signing / validating signatures
    mapping (address => uint) nonces;

    // ARCH token
    IArchToken archToken;

    // Vesting contract
    IVesting vesting;
}

/// @notice A checkpoint for marking number of votes from a given block
struct Checkpoint {
    uint32 fromBlock;
    uint256 votes;
}

/// @notice All storage variables related to checkpoints
struct CheckpointStorage {
     // A record of vote checkpoints for each account, by index
    mapping (address => mapping (uint32 => Checkpoint)) checkpoints;

    // The number of checkpoints for each account
    mapping (address => uint32) numCheckpoints;
}

/// @notice All storage variables related to staking
struct StakeStorage {
    // Total amount staked in the VotingPower contract for each token > amount
    mapping (address => uint256) totalStaked;

    // Official record of staked balances for each account > token > amount
    mapping (address => mapping (address => uint256)) stakes;
}

library VotingPowerStorage {
    bytes32 constant VOTING_POWER_APP_STORAGE_POSITION = keccak256("voting.power.app.storage");
    bytes32 constant VOTING_POWER_CHECKPOINT_STORAGE_POSITION = keccak256("voting.power.checkpoint.storage");
    bytes32 constant VOTING_POWER_STAKE_STORAGE_POSITION = keccak256("voting.power.stake.storage");
    
    /**
     * @notice Load app storage struct from specified VOTING_POWER_APP_STORAGE_POSITION
     * @return app AppStorage struct
     */
    function appStorage() internal pure returns (AppStorage storage app) {        
        bytes32 position = VOTING_POWER_APP_STORAGE_POSITION;
        assembly {
            app.slot := position
        }
    }

    /**
     * @notice Load checkpoint storage struct from specified VOTING_POWER_CHECKPOINT_STORAGE_POSITION
     * @return cs CheckpointStorage struct
     */
    function checkpointStorage() internal pure returns (CheckpointStorage storage cs) {        
        bytes32 position = VOTING_POWER_CHECKPOINT_STORAGE_POSITION;
        assembly {
            cs.slot := position
        }
    }

    /**
     * @notice Load stake storage struct from specified VOTING_POWER_STAKE_STORAGE_POSITION
     * @return ss StakeStorage struct
     */
    function stakeStorage() internal pure returns (StakeStorage storage ss) {        
        bytes32 position = VOTING_POWER_STAKE_STORAGE_POSITION;
        assembly {
            ss.slot := position
        }
    }
}