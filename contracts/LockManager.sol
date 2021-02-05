// SPDX-License-Identifier: MIT
pragma solidity ^0.7.0;
pragma experimental ABIEncoderV2;

import "./interfaces/IVotingPower.sol";
import "./interfaces/ITokenRegistry.sol";
import "./interfaces/IVotingPowerFormula.sol";
import "./lib/AccessControl.sol";
import "./lib/SafeMath.sol";
import "hardhat/console.sol";

contract LockManager is AccessControl {
    using SafeMath for uint256;

    /// @notice Admin role to create voting power from locked stakes
    bytes32 public constant LOCKER_ROLE = keccak256("LOCKER_ROLE");

    /// @notice The amount of a given locked token that has been staked, and the resulting voting power
    struct LockedStake {
        uint256 amount;
        uint256 votingPower;
    }

    // Official record of staked balances for each account > token > locked stake
    mapping (address => mapping (address => LockedStake)) lockedStakes;

    /// @notice Voting power contract
    IVotingPower public votingPower;

    /// @notice modifier to restrict functions to only contracts that have been added as lockers
    modifier onlyLockers() {
        require(hasRole(LOCKER_ROLE, msg.sender), "Caller must have LOCKER_ROLE role");
        _;
    }

    /// @notice An event that's emitted when a user's staked balance increases
    event StakeLocked(address indexed user, address indexed token, uint256 indexed amount, uint256 votingPower);

    /// @notice An event that's emitted when a user's staked balance decreases
    event StakeWithdrew(address indexed user, address indexed token, uint256 indexed amount, uint256 votingPower);

    constructor(address _votingPower, address _roleManager) {
        votingPower = IVotingPower(_votingPower);
        _setupRole(DEFAULT_ADMIN_ROLE, _roleManager);
    }

    /**
     * @notice Get total amount of tokens staked in contract by `staker`
     * @param staker The user with staked tokens
     * @param stakedToken The staked token
     * @return total amount staked
     */
    function getAmountStaked(address staker, address stakedToken) public view returns (uint256) {
        return getStake(staker, stakedToken).amount;
    }

    /**
     * @notice Get total staked amount and voting power from `stakedToken` staked in contract by `staker`
     * @param staker The user with staked tokens
     * @param stakedToken The staked token
     * @return total staked
     */
    function getStake(address staker, address stakedToken) public view returns (LockedStake memory) {
        return lockedStakes[staker][stakedToken];
    }

    function calculateVotingPower(address token, uint256 amount) public view returns (uint256) {
        address registry = votingPower.tokenRegistry();
        require(registry != address(0), "LM::calculateVotingPower: registry not set");
        address tokenFormulaAddress = ITokenRegistry(registry).tokenFormulas(token);
        require(tokenFormulaAddress != address(0), "LM::calculateVotingPower: token not supported");
        
        IVotingPowerFormula tokenFormula = IVotingPowerFormula(tokenFormulaAddress);
        return tokenFormula.convertTokensToVotingPower(amount);
    }

    function grantVotingPower(address receiver, address token, uint256 tokenAmount) public onlyLockers {
        uint256 vpToAdd = calculateVotingPower(token, tokenAmount);
        lockedStakes[receiver][token].amount = lockedStakes[receiver][token].amount.add(tokenAmount);
        lockedStakes[receiver][token].votingPower = lockedStakes[receiver][token].votingPower.add(vpToAdd);
        votingPower.addVotingPowerForLockedTokens(receiver, vpToAdd);
        emit StakeLocked(receiver, token, tokenAmount, vpToAdd);
    }

    function removeVotingPower(address receiver, address token, uint256 tokenAmount) public onlyLockers {
        require(lockedStakes[receiver][token].amount >= tokenAmount, "LM::removeVotingPower: not enough tokens staked");
        LockedStake memory s = getStake(receiver, token);
        uint256 vpToWithdraw = tokenAmount.mul(s.votingPower).div(s.amount);
        lockedStakes[receiver][token].amount = lockedStakes[receiver][token].amount.sub(tokenAmount);
        lockedStakes[receiver][token].votingPower = lockedStakes[receiver][token].votingPower.add(vpToWithdraw);
        votingPower.removeVotingPowerForUnlockedTokens(receiver, vpToWithdraw);
        emit StakeWithdrew(receiver, token, tokenAmount, vpToWithdraw);
    }
}