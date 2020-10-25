// SPDX-License-Identifier: MIT
pragma solidity ^0.7.0;
pragma experimental ABIEncoderV2;

import "./lib/SafeMath.sol";
import "./interfaces/IArchToken.sol";
import "./interfaces/IVotingPower.sol";

contract Vesting {
    using SafeMath for uint256;

    uint256 constant internal SECONDS_PER_DAY = 86400;

    struct Grant {
        uint256 startTime;
        uint256 amount;
        uint16 vestingDuration;
        uint16 vestingCliff;
        uint256 totalClaimed;
    }

    event GrantAdded(address indexed recipient, uint256 amount, uint256 startTime, uint16 vestingDurationInDays, uint16 vestingCliffInDays);
    event GrantTokensClaimed(address indexed recipient, uint256 amountClaimed);
    event GrantRemoved(address recipient, uint256 amountVested, uint256 amountNotVested);
    event ChangedOwner(address indexed newOwner, address oldOwner);
    event ChangedVotingPower(address indexed newContract, address oldContract);

    IArchToken public token;
    IVotingPower public votingPower;
    
    mapping (address => Grant) public tokenGrants;
    address public owner;

    constructor(address _token) {
        require(_token != address(0), "ArchVest::constructor: must be valid token address");
        token = IArchToken(_token);
        owner = msg.sender;
    }
    
    function addTokenGrant(
        address recipient,
        uint256 startTime,
        uint256 amount,
        uint16 vestingDurationInDays,
        uint16 vestingCliffInDays
    ) 
        external
    {
        require(msg.sender == owner, "ArchVest::addTokenGrant: not owner");
        require(address(votingPower) != address(0), "ArchVest::addTokenGrant: Set Voting Power contract first");
        require(vestingCliffInDays <= 10*365, "ArchVest::addTokenGrant: cliff more than 10 years");
        require(vestingDurationInDays > 0, "ArchVest::addTokenGrant: duration must be > 0");
        require(vestingDurationInDays <= 25*365, "ArchVest::addTokenGrant: duration more than 25 years");
        require(vestingDurationInDays >= vestingCliffInDays, "ArchVest::addTokenGrant: Duration < Cliff");
        require(tokenGrants[recipient].amount == 0, "ArchVest::addTokenGrant: grant already exists for account");
        
        uint256 amountVestedPerDay = amount.div(vestingDurationInDays);
        require(amountVestedPerDay > 0, "ArchVest::addTokenGrant: amountVestedPerDay > 0");

        // Transfer the grant tokens under the control of the vesting contract
        require(token.transferFrom(owner, address(this), amount), "ArchVest::addTokenGrant: transfer failed");

        uint256 grantStartTime = startTime == 0 ? block.timestamp : startTime;

        Grant memory grant = Grant({
            startTime: grantStartTime,
            amount: amount,
            vestingDuration: vestingDurationInDays,
            vestingCliff: vestingCliffInDays,
            totalClaimed: 0
        });
        tokenGrants[recipient] = grant;
        emit GrantAdded(recipient, amount, grantStartTime, vestingDurationInDays, vestingCliffInDays);
        votingPower.addVotingPowerForVestingTokens(recipient, amount);
    }

    function getTokenGrant(address recipient) public view returns(Grant memory){
        return tokenGrants[recipient];
    }

    /// @notice Calculate the vested and unclaimed tokens available for `recipient` to claim
    /// Due to rounding errors once grant duration is reached, returns the entire left grant amount
    /// Returns 0 if cliff has not been reached
    function calculateGrantClaim(address recipient) public view returns (uint256) {
        Grant storage tokenGrant = tokenGrants[recipient];

        // For grants created with a future start date, that hasn't been reached, return 0, 0
        if (block.timestamp < tokenGrant.startTime) {
            return 0;
        }

        // Check cliff was reached
        uint256 elapsedTime = block.timestamp.sub(tokenGrant.startTime);
        uint256 elapsedDays = elapsedTime.div(SECONDS_PER_DAY);
        
        if (elapsedDays < tokenGrant.vestingCliff) {
            return 0;
        }

        // If over vesting duration, all tokens vested
        if (elapsedDays >= tokenGrant.vestingDuration) {
            uint256 remainingGrant = tokenGrant.amount.sub(tokenGrant.totalClaimed);
            return remainingGrant;
        } else {
            uint256 vestingDurationInSecs = uint256(tokenGrant.vestingDuration).mul(SECONDS_PER_DAY);
            uint256 amountVested = tokenGrant.amount.div(vestingDurationInSecs);
            uint256 claimableAmount = amountVested.sub(tokenGrant.totalClaimed);
            return claimableAmount;
        }
    }

    /// @notice Calculate the vested (claimed + unclaimed) tokens for `recipient`
    /// Returns 0 if cliff has not been reached
    function vestedBalance(address recipient) external view returns (uint256) {
        Grant storage tokenGrant = tokenGrants[recipient];

        // For grants created with a future start date, that hasn't been reached, return 0, 0
        if (block.timestamp < tokenGrant.startTime) {
            return 0;
        }

        // Check cliff was reached
        uint256 elapsedTime = block.timestamp.sub(tokenGrant.startTime);
        uint256 elapsedDays = elapsedTime.div(SECONDS_PER_DAY);
        
        if (elapsedDays < tokenGrant.vestingCliff) {
            return 0;
        }

        // If over vesting duration, all tokens vested
        if (elapsedDays >= tokenGrant.vestingDuration) {
            return tokenGrant.amount;
        } else {
            uint256 vestingDurationInSecs = uint256(tokenGrant.vestingDuration).mul(SECONDS_PER_DAY);
            uint256 amountVested = tokenGrant.amount.div(vestingDurationInSecs);
            return amountVested;
        }
    }

    /// @notice Return the number of claimed tokens by `recipient`
    function claimedBalance(address recipient) external view returns (uint256) {
        Grant storage tokenGrant = tokenGrants[recipient];
        return tokenGrant.totalClaimed;
    }

    /// @notice Allows a grant recipient to claim their vested tokens. Errors if no tokens have vested
    /// It is advised recipients check they are entitled to claim via `calculateGrantClaim` before calling this
    function claimVestedTokens(address recipient) external {
        uint256 amountVested = calculateGrantClaim(recipient);
        require(amountVested > 0, "amountVested is 0");
        votingPower.removeVotingPowerForClaimedTokens(recipient, amountVested);

        Grant storage tokenGrant = tokenGrants[recipient];
        tokenGrant.totalClaimed = uint256(tokenGrant.totalClaimed.add(amountVested));
        
        require(token.transfer(recipient, amountVested), "no tokens");
        emit GrantTokensClaimed(recipient, amountVested);
    }

    function tokensVestedPerDay(address recipient) public view returns(uint256) {
        Grant storage tokenGrant = tokenGrants[recipient];
        return tokenGrant.amount.div(uint256(tokenGrant.vestingDuration));
    }

    function setVotingPowerContract(address newContract) 
        external 
    {
        require(msg.sender == owner, "ArchVest::setVotingPowerContract: not owner");
        require(newContract != address(0) && newContract != address(this) && newContract != address(token), "ArchVest::setVotingPowerContract: not valid contract address");
        address oldContract = address(votingPower);
        votingPower = IVotingPower(newContract);
        emit ChangedVotingPower(newContract, oldContract);
    }

    function changeOwner(address newOwner) 
        external
    {
        require(msg.sender == owner, "ArchVest::changeOwner: not owner");
        require(newOwner != address(0) && newOwner != address(this) && newOwner != address(token), "ArchVest::changeOwner: not valid address");

        address oldOwner = owner;
        owner = newOwner;
        emit ChangedOwner(newOwner, oldOwner);
    }
}