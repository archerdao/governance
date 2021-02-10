// SPDX-License-Identifier: MIT
pragma solidity ^0.7.0;
pragma experimental ABIEncoderV2;

import "./IERC20.sol";

interface IVault {
    
    struct Lock {
        address token;
        address receiver;
        uint256 startTime;
        uint256 amount;
        uint16 duration;
        uint256 amountClaimed;
        bool hasVotingPower;
    }

    function lockTokens(address token, address locker, address receiver, uint256 startTime, uint256 amount, uint16 lockDurationInDays, bool grantVotingPower) external;
    function lockTokensWithPermit(address token, address locker, address receiver, uint256 startTime, uint256 amount, uint16 lockDurationInDays, bool grantVotingPower, uint256 deadline, uint8 v, bytes32 r, bytes32 s) external;
    function claimUnlockedTokens(uint256[] memory lockIds, uint256[] memory amounts) external;
    function claimAllUnlockedTokens(uint256[] memory lockIds) external;
    function getTokenLock(uint256 lockId) external view returns(Lock memory);
    function getLockedBalance(uint256 lockId) external view returns (uint256);
    function getUnlockedBalance(uint256 lockId) external view returns (uint256);
    function getActiveLocks(address receiver) external view returns(uint256[] memory);
    function getAllActiveLocks(address receiver) external view returns(Lock[] memory receiverLocks);
    function getLockedTokenBalance(address token, address receiver) external view returns(uint256 lockedBalance);
    function getUnlockedTokenBalance(address token, address receiver) external view returns(uint256 unlockedBalance);
    function extendLock(uint256 lockId, uint16 daysToAdd) external;
} 