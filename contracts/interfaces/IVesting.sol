// SPDX-License-Identifier: MIT
pragma solidity ^0.7.0;
pragma experimental ABIEncoderV2;

import "./IArchToken.sol";
import "./IVotingPower.sol";

interface IVesting {
    
    struct Grant {
        uint256 startTime;
        uint256 amount;
        uint16 vestingDuration;
        uint16 vestingCliff;
        uint256 totalClaimed;
    }

    function owner() external view returns (address);
    function token() external view returns (IArchToken);
    function votingPower() external view returns (IVotingPower);
    function addTokenGrant(address recipient, uint256 startTime, uint256 amount, uint16 vestingDurationInDays, uint16 vestingCliffInDays) external;
    function getTokenGrant(address recipient) external view returns(Grant memory);
    function calculateGrantClaim(address recipient) external view returns (uint256);
    function vestedBalance(address account) external view returns (uint256);
    function claimedBalance(address recipient) external view returns (uint256);
    function claimVestedTokens(address recipient) external;
    function tokensVestedPerDay(address recipient) external view returns(uint256);
    function setVotingPowerContract(address newContract) external;
    function changeOwner(address newOwner) external;
    event GrantAdded(address indexed recipient, uint256 indexed amount, uint256 startTime, uint16 vestingDurationInDays, uint16 vestingCliffInDays);
    event GrantTokensClaimed(address indexed recipient, uint256 indexed amountClaimed);
    event ChangedOwner(address indexed oldOwner, address indexed newOwner);
    event ChangedVotingPower(address indexed oldContract, address indexed newContract);

} 