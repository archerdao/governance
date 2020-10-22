// SPDX-License-Identifier: MIT
pragma solidity ^0.7.0;
pragma experimental ABIEncoderV2;

import "./lib/SafeMath.sol";
import "./interfaces/IArchToken.sol";
import "./interfaces/IVotingPower.sol";

contract Vesting {
    using SafeMath for uint256;
    using SafeMath for uint16;
    
    modifier onlyOwner {
        require(msg.sender == owner, "not owner");
        _;
    }

    modifier onlyValidAddress(address _address) {
        require(_address != address(0) && _address != address(this) && _address != address(token), "not valid address");
        _;
    }

    uint256 constant internal SECONDS_PER_DAY = 86400;

    struct Grant {
        uint256 startTime;
        uint256 amount;
        uint16 vestingDuration;
        uint16 vestingCliff;
        uint256 totalClaimed;
    }

    event GrantAdded(address indexed recipient, uint256 amount, uint16 vestingDurationInDays, uint16 vestingCliffInDays, uint16 grantId);
    event GrantTokensClaimed(address indexed recipient, uint256 amountClaimed);
    event GrantRemoved(address recipient, uint256 amountVested, uint256 amountNotVested);
    event ChangedOwner(address indexed newOwner, address oldOwner);
    event ChangedVotingPower(address indexed newContract, address oldContract);

    IArchToken public token;

    IVotingPower public votingPower;
    
    mapping (address => Grant) public tokenGrants;
    address public owner;
    uint16 public totalVestingCount;

    constructor(address _token) {
        require(_token != address(0));
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
        onlyOwner
    {
        require(address(votingPower) != address(0), "Set Voting Power contract first");
        require(vestingCliffInDays <= 10*365, "more than 10 years");
        require(vestingDurationInDays <= 25*365, "more than 25 years");
        require(vestingDurationInDays >= vestingCliffInDays, "Duration < Cliff");
        require(tokenGrants[recipient].amount == 0, "grant already exists for account");
        
        uint256 amountVestedPerDay = amount.div(vestingDurationInDays);
        require(amountVestedPerDay > 0, "amountVestedPerDay > 0");

        // Transfer the grant tokens under the control of the vesting contract
        require(token.transferFrom(owner, address(this), amount), "transfer failed");

        Grant memory grant = Grant({
            startTime: startTime == 0 ? currentTime() : startTime,
            amount: amount,
            vestingDuration: vestingDurationInDays,
            vestingCliff: vestingCliffInDays,
            totalClaimed: 0
        });
        tokenGrants[recipient] = grant;
        emit GrantAdded(recipient, amount, vestingDurationInDays, vestingCliffInDays, totalVestingCount);
        totalVestingCount++;
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
        if (currentTime() < tokenGrant.startTime) {
            return 0;
        }

        // Check cliff was reached
        uint elapsedTime = currentTime().sub(tokenGrant.startTime);
        uint elapsedDays = elapsedTime.div(SECONDS_PER_DAY);
        
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
        if (currentTime() < tokenGrant.startTime) {
            return 0;
        }

        // Check cliff was reached
        uint elapsedTime = currentTime().sub(tokenGrant.startTime);
        uint elapsedDays = elapsedTime.div(SECONDS_PER_DAY);
        
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

    /// @notice Terminate token grant transferring all vested tokens to the `recipient`
    /// and returning all non-vested tokens to the owner
    /// Secured to the owner only
    /// @param recipient the token grant recipient
    // TODO: determine if needed
    function removeTokenGrant(address recipient) 
        external 
        onlyOwner
    {
        Grant storage tokenGrant = tokenGrants[recipient];
        uint256 amountVested = calculateGrantClaim(recipient);
        votingPower.removeVotingPowerForClaimedTokens(recipient, amountVested);

        uint256 amountNotVested = (tokenGrant.amount.sub(tokenGrant.totalClaimed)).sub(amountVested);

        require(token.transfer(recipient, amountVested));
        require(token.transfer(owner, amountNotVested));

        tokenGrant.startTime = 0;
        tokenGrant.amount = 0;
        tokenGrant.vestingDuration = 0;
        tokenGrant.vestingCliff = 0;
        tokenGrant.totalClaimed = 0;
        
        emit GrantRemoved(recipient, amountVested, amountNotVested);
    }

    function currentTime() private view returns(uint256) {
        return block.timestamp;
    }

    function tokensVestedPerDay(address recipient) public view returns(uint256) {
        Grant storage tokenGrant = tokenGrants[recipient];
        return tokenGrant.amount.div(uint256(tokenGrant.vestingDuration));
    }

    function setVotingPowerContract(address newContract) 
        external 
        onlyOwner
        onlyValidAddress(newContract)
    {
        address oldContract = address(votingPower);
        votingPower = IVotingPower(newContract);
        emit ChangedVotingPower(newContract, oldContract);
    }

    function changeOwner(address newOwner) 
        external 
        onlyOwner
        onlyValidAddress(newOwner)
    {
        address oldOwner = owner;
        owner = newOwner;
        emit ChangedOwner(newOwner, oldOwner);
    }
}