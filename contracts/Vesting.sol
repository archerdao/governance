// SPDX-License-Identifier: MIT
pragma solidity ^0.6.12;
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
        require(_address != address(0) && _address != address(this) && _address != address(token), "not valid _address");
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

    constructor(address _token) public {
        require(_token != address(0));
        token = IArchToken(_token);
        owner = msg.sender;
    }
    
    function addTokenGrant(
        address _recipient,
        uint256 _startTime,
        uint256 _amount,
        uint16 _vestingDurationInDays,
        uint16 _vestingCliffInDays
    ) 
        external
        onlyOwner
    {
        require(address(votingPower) != address(0), "Set Voting Power contract first");
        require(_vestingCliffInDays <= 10*365, "more than 10 years");
        require(_vestingDurationInDays <= 25*365, "more than 25 years");
        require(_vestingDurationInDays >= _vestingCliffInDays, "Duration < Cliff");
        require(tokenGrants[_recipient].amount == 0, "grant already exists for account");
        
        uint256 amountVestedPerDay = _amount.div(_vestingDurationInDays);
        require(amountVestedPerDay > 0, "amountVestedPerDay > 0");

        // Transfer the grant tokens under the control of the vesting contract
        require(token.transferFrom(owner, address(this), _amount), "transfer failed");

        Grant memory grant = Grant({
            startTime: _startTime == 0 ? currentTime() : _startTime,
            amount: _amount,
            vestingDuration: _vestingDurationInDays,
            vestingCliff: _vestingCliffInDays,
            totalClaimed: 0
        });
        tokenGrants[_recipient] = grant;
        emit GrantAdded(_recipient, _amount, _vestingDurationInDays, _vestingCliffInDays, totalVestingCount);
        totalVestingCount++;
        votingPower.addVotingPowerForVestingTokens(_recipient, _amount);
    }

    function getTokenGrant(address _recipient) public view returns(Grant memory){
        return tokenGrants[_recipient];
    }

    /// @notice Calculate the vested and unclaimed tokens available for `_recipient` to claim
    /// Due to rounding errors once grant duration is reached, returns the entire left grant amount
    /// Returns 0 if cliff has not been reached
    function calculateGrantClaim(address _recipient) public view returns (uint256) {
        Grant storage tokenGrant = tokenGrants[_recipient];

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

    /// @notice Calculate the vested (claimed + unclaimed) tokens for `_recipient`
    /// Returns 0 if cliff has not been reached
    function vestedBalance(address _recipient) external view returns (uint256) {
        Grant storage tokenGrant = tokenGrants[_recipient];

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

    /// @notice Return the number of claimed tokens by `_recipient`
    function claimedBalance(address _recipient) external view returns (uint256) {
        Grant storage tokenGrant = tokenGrants[_recipient];
        return tokenGrant.totalClaimed;
    }

    /// @notice Allows a grant recipient to claim their vested tokens. Errors if no tokens have vested
    /// It is advised recipients check they are entitled to claim via `calculateGrantClaim` before calling this
    function claimVestedTokens(address _recipient) external {
        uint256 amountVested = calculateGrantClaim(_recipient);
        require(amountVested > 0, "amountVested is 0");
        votingPower.removeVotingPowerForClaimedTokens(_recipient, amountVested);

        Grant storage tokenGrant = tokenGrants[_recipient];
        tokenGrant.totalClaimed = uint256(tokenGrant.totalClaimed.add(amountVested));
        
        require(token.transfer(_recipient, amountVested), "no tokens");
        emit GrantTokensClaimed(_recipient, amountVested);
    }

    /// @notice Terminate token grant transferring all vested tokens to the `_recipient`
    /// and returning all non-vested tokens to the owner
    /// Secured to the owner only
    /// @param _recipient the token grant recipient
    // TODO: determine if needed
    function removeTokenGrant(address _recipient) 
        external 
        onlyOwner
    {
        Grant storage tokenGrant = tokenGrants[_recipient];
        uint256 amountVested = calculateGrantClaim(_recipient);
        votingPower.removeVotingPowerForClaimedTokens(_recipient, amountVested);

        uint256 amountNotVested = (tokenGrant.amount.sub(tokenGrant.totalClaimed)).sub(amountVested);

        require(token.transfer(_recipient, amountVested));
        require(token.transfer(owner, amountNotVested));

        tokenGrant.startTime = 0;
        tokenGrant.amount = 0;
        tokenGrant.vestingDuration = 0;
        tokenGrant.vestingCliff = 0;
        tokenGrant.totalClaimed = 0;
        
        emit GrantRemoved(_recipient, amountVested, amountNotVested);
    }

    function currentTime() private view returns(uint256) {
        return block.timestamp;
    }

    function tokensVestedPerDay(address _recipient) public view returns(uint256) {
        Grant storage tokenGrant = tokenGrants[_recipient];
        return tokenGrant.amount.div(uint256(tokenGrant.vestingDuration));
    }

    function setVotingPowerContract(address _newContract) 
        external 
        onlyOwner
        onlyValidAddress(_newContract)
    {
        address oldContract = address(votingPower);
        votingPower = IVotingPower(_newContract);
        emit ChangedVotingPower(_newContract, oldContract);
    }

    function changeOwner(address _newOwner) 
        external 
        onlyOwner
        onlyValidAddress(_newOwner)
    {
        address oldOwner = owner;
        owner = _newOwner;
        emit ChangedOwner(_newOwner, oldOwner);
    }
}