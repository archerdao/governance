// SPDX-License-Identifier: MIT
pragma solidity ^0.7.0;
pragma experimental ABIEncoderV2;

import "./interfaces/IERC20.sol";
import "./lib/SafeMath.sol";

/**
 * @title Vault
 * @dev Contract for locking up tokens without providing voting power
 */
contract Vault {
    using SafeMath for uint256;

    /// @notice Lock definition
    struct Lock {
        uint256 startTime;
        uint256 amount;
        uint16 duration;
    }

    /// @dev Used to translate lock periods specified in days to seconds
    uint256 constant internal SECONDS_PER_DAY = 86400;

    /// @notice Token that will be locked
    IERC20 public token;
    
    /// @notice Mapping of locker address > token locks
    mapping (address => Lock) public tokenLocks;

    /// @notice Event emitted when a new lock is created
    event LockCreated(address indexed locker, uint256 indexed amount, uint256 startTime, uint16 durationInDays);
    
    /// @notice Event emitted when tokens are claimed by a locker from an unlocked balance
    event UnlockedTokensClaimed(address indexed locker, uint256 indexed amountClaimed);

    /**
     * @notice Construct a new Vault contract
     * @param _token Address of token
     */
    constructor(address _token) {
        require(_token != address(0), "Vault::constructor: must be valid token address");
        token = IERC20(_token);
    }
    
    /**
     * @notice Lock tokens
     * @param startTime The unix timestamp when the lock period will start
     * @param amount The amount of tokens being locked
     * @param lockDurationInDays The lock period in days
     */
    function lockTokens(
        address locker,
        uint256 startTime,
        uint256 amount,
        uint16 lockDurationInDays
    ) 
        external
    {
        require(lockDurationInDays > 0, "Vault::lockTokens: duration must be > 0");
        require(lockDurationInDays <= 25*365, "Vault::lockTokens: duration more than 25 years");
        require(tokenLocks[locker].amount == 0, "Vault::lockTokens: lock already exists for account");

        // Transfer the tokens under the control of the vault contract
        require(token.transferFrom(locker, address(this), amount), "Vault::lockTokens: transfer failed");

        uint256 lockStartTime = startTime == 0 ? block.timestamp : startTime;

        Lock memory lock = Lock({
            startTime: lockStartTime,
            amount: amount,
            duration: lockDurationInDays
        });
        tokenLocks[locker] = lock;
        emit LockCreated(locker, amount, lockStartTime, lockDurationInDays);
    }

    /**
     * @notice Get token lock for locker
     * @param locker The address that has a lock
     * @return the lock
     */
    function getTokenLock(address locker) public view returns(Lock memory){
        return tokenLocks[locker];
    }

    /**
     * @notice Get the locked token balance for `locker`
     * @dev Returns 0 if duration has ended
     * @param locker The address that has a lock
     * @return The amount locker currently has locked
     */
    function getLockedBalance(address locker) public view returns (uint256) {
        Lock storage lock = tokenLocks[locker];

        // For locks created with a future start date, that hasn't been reached, return full amount
        if (block.timestamp < lock.startTime) {
            return lock.amount;
        }

        // Check duration was reached
        uint256 elapsedTime = block.timestamp.sub(lock.startTime);
        uint256 elapsedDays = elapsedTime.div(SECONDS_PER_DAY);
        
        if (elapsedDays >= lock.duration) {
            return 0;
        } else {
            return lock.amount;
        }
    }

    /**
     * @notice Get the unlocked token balance for `locker`
     * @dev Returns 0 if duration has not ended
     * @param locker The address that has a lock
     * @return The amount locker can claim
     */
    function getUnlockedBalance(address locker) public view returns (uint256) {
        Lock storage lock = tokenLocks[locker];

        // For locks created with a future start date, that hasn't been reached, return 0, 0
        if (block.timestamp < lock.startTime) {
            return 0;
        }

        // Check duration was reached
        uint256 elapsedTime = block.timestamp.sub(lock.startTime);
        uint256 elapsedDays = elapsedTime.div(SECONDS_PER_DAY);
        
        if (elapsedDays < lock.duration) {
            return 0;
        } else {
            return lock.amount;
        }
    }

    /**
     * @notice Allows a LOCKER to claim their unlocked tokens
     * @dev Errors if no tokens are unlocked
     * @dev It is advised lockers check they are entitled to claim via `getUnlockedBalance` before calling this
     * @param locker The address that has an unlocked token balance
     */
    function claimUnlockedTokens(address locker) external {
        uint256 unlockedAmount = getUnlockedBalance(locker);
        require(unlockedAmount > 0, "Vault::claimUnlockedTokens: unlockedAmount is 0");

        Lock memory lock = Lock({
            startTime: 0,
            amount: 0,
            duration: 0
        });
        tokenLocks[locker] = lock;
        
        require(token.transfer(locker, unlockedAmount), "Vault::claimUnlockedTokens: transfer failed");
        emit UnlockedTokensClaimed(locker, unlockedAmount);
    }
}