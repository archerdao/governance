// SPDX-License-Identifier: MIT
pragma solidity ^0.7.0;
pragma experimental ABIEncoderV2;

import "./lib/SafeMath.sol";
import "./lib/Initializable.sol";
import "./lib/ReentrancyGuardUpgradeSafe.sol";
import "./lib/VotingPowerStorage.sol";
import "./VotingPowerProxy.sol";

contract VotingPower is Initializable, ReentrancyGuardUpgradeSafe {
    using SafeMath for uint256;

    /// @notice An event that's emitted when a user's staked balance increases
    event Staked(address indexed user, uint256 amount);

    /// @notice An event that's emitted when a user's staked balance decreases
    event Withdrawn(address indexed user, uint256 amount);

    /// @notice An event that's emitted when an account's vote balance changes
    event VotingPowerChanged(address indexed voter, uint previousBalance, uint newBalance);

    function initialize(
        address _archToken,
        address _vestingContract
    ) public initializer {
        __ReentrancyGuard_init_unchained();
        AppStorage storage app = VotingPowerStorage.appStorage();
        app.archToken = IArchToken(_archToken);
        app.vesting = IVesting(_vestingContract);
    }

    /**
     * @notice Stake ARCH tokens using offchain approvals to unlock voting power
     * @param amount The amount to stake
     * @param deadline The time at which to expire the signature
     * @param v The recovery byte of the signature
     * @param r Half of the ECDSA signature pair
     * @param s Half of the ECDSA signature pair
     */
    function stakeWithPermit(uint256 amount, uint deadline, uint8 v, bytes32 r, bytes32 s) external nonReentrant {
        require(amount > 0, "Cannot stake 0");
        AppStorage storage app = VotingPowerStorage.appStorage();
        app.archToken.permit(msg.sender, address(this), amount, deadline, v, r, s);
        StakeStorage storage ss = VotingPowerStorage.stakeStorage();
        ss.totalStaked = ss.totalStaked.add(amount);
        ss.stakes[msg.sender] = ss.stakes[msg.sender].add(amount);

        app.archToken.transferFrom(msg.sender, address(this), amount);
        emit Staked(msg.sender, amount);
        _increaseVotingPower(msg.sender, amount);
    }

    /**
     * @notice Stake ARCH tokens to unlock voting power for `msg.sender`
     * @param amount The amount to stake
     */
    function stake(uint256 amount) external nonReentrant {
        AppStorage storage app = VotingPowerStorage.appStorage();
        require(amount > 0, "Cannot stake 0");
        require(app.archToken.allowance(msg.sender, address(this)) >= amount, "Must approve tokens before staking");
        StakeStorage storage ss = VotingPowerStorage.stakeStorage();
        ss.totalStaked = ss.totalStaked.add(amount);
        ss.stakes[msg.sender] = ss.stakes[msg.sender].add(amount);
        app.archToken.transferFrom(msg.sender, address(this), amount);
        emit Staked(msg.sender, amount);
        _increaseVotingPower(msg.sender, amount);
    }

    /**
     * @notice Count vesting ARCH tokens toward voting power for `account`
     * @param account The recipient of voting power
     * @param amount The amount of voting power to add
     */
    function addVotingPowerForVestingTokens(address account, uint256 amount) external nonReentrant {
        AppStorage storage app = VotingPowerStorage.appStorage();
        require(amount > 0, "Cannot add 0 voting power");
        require(msg.sender == address(app.vesting), "Only vesting contract");
        _increaseVotingPower(account, amount);
    }

    /**
     * @notice Remove claimed vesting ARCH tokens from voting power for `account`
     * @param account The account with voting power
     * @param amount The amount of voting power to remove
     */
    function removeVotingPowerForClaimedTokens(address account, uint256 amount) external nonReentrant {
        AppStorage storage app = VotingPowerStorage.appStorage();
        require(amount > 0, "Cannot remove 0 voting power");
        require(msg.sender == address(app.vesting), "Only vesting contract");
        _decreaseVotingPower(account, amount);
    }

    /**
     * @notice Withdraw staked ARCH tokens, removing voting power for `msg.sender`
     * @param amount The amount to withdraw
     */
    function withdraw(uint256 amount) external nonReentrant {
        require(amount > 0, "Cannot withdraw 0");
        StakeStorage storage ss = VotingPowerStorage.stakeStorage();
        ss.totalStaked = ss.totalStaked.sub(amount);
        ss.stakes[msg.sender] = ss.stakes[msg.sender].sub(amount);
        AppStorage storage app = VotingPowerStorage.appStorage();
        app.archToken.transfer(msg.sender, amount);
        emit Withdrawn(msg.sender, amount);
        _decreaseVotingPower(msg.sender, amount);
    }

    /**
     * @notice Gets the current votes balance for `account`
     * @param account The address to get votes balance
     * @return The number of current votes for `account`
     */
    function getCurrentVotes(address account) external view returns (uint256) {
        CheckpointStorage storage cs = VotingPowerStorage.checkpointStorage();
        uint32 nCheckpoints = cs.numCheckpoints[account];
        return nCheckpoints > 0 ? cs.checkpoints[account][nCheckpoints - 1].votes : 0;
    }

    /**
     * @notice Determine the prior number of votes for an account as of a block number
     * @dev Block number must be a finalized block or else this function will revert to prevent misinformation.
     * @param account The address of the account to check
     * @param blockNumber The block number to get the vote balance at
     * @return The number of votes the account had as of the given block
     */
    function getPriorVotes(address account, uint blockNumber) public view returns (uint256) {
        require(blockNumber < block.number, "Arch::getPriorVotes: not yet determined");
        
        CheckpointStorage storage cs = VotingPowerStorage.checkpointStorage();
        uint32 nCheckpoints = cs.numCheckpoints[account];
        if (nCheckpoints == 0) {
            return 0;
        }

        // First check most recent balance
        if (cs.checkpoints[account][nCheckpoints - 1].fromBlock <= blockNumber) {
            return cs.checkpoints[account][nCheckpoints - 1].votes;
        }

        // Next check implicit zero balance
        if (cs.checkpoints[account][0].fromBlock > blockNumber) {
            return 0;
        }

        uint32 lower = 0;
        uint32 upper = nCheckpoints - 1;
        while (upper > lower) {
            uint32 center = upper - (upper - lower) / 2; // ceil, avoiding overflow
            Checkpoint memory cp = cs.checkpoints[account][center];
            if (cp.fromBlock == blockNumber) {
                return cp.votes;
            } else if (cp.fromBlock < blockNumber) {
                lower = center;
            } else {
                upper = center - 1;
            }
        }
        return cs.checkpoints[account][lower].votes;
    }

    function _increaseVotingPower(address voter, uint256 amount) internal {
        // TODO: make sure it's not possible to mint voting power
        CheckpointStorage storage cs = VotingPowerStorage.checkpointStorage();
        uint32 checkpointNum = cs.numCheckpoints[voter];
        uint256 votingPowerOld = checkpointNum > 0 ? cs.checkpoints[voter][checkpointNum - 1].votes : 0;
        uint256 votingPowerNew = votingPowerOld.add(amount);
        _writeCheckpoint(voter, checkpointNum, votingPowerOld, votingPowerNew);
    }

    function _decreaseVotingPower(address voter, uint256 amount) internal {
        // TODO: make sure it's not possible to burn voting power
        CheckpointStorage storage cs = VotingPowerStorage.checkpointStorage();
        uint32 checkpointNum = cs.numCheckpoints[voter];
        uint256 votingPowerOld = checkpointNum > 0 ? cs.checkpoints[voter][checkpointNum - 1].votes : 0;
        uint256 votingPowerNew = votingPowerOld.sub(amount);
        _writeCheckpoint(voter, checkpointNum, votingPowerOld, votingPowerNew);
    }

    function _moveVotingPower(address srcRep, address dstRep, uint256 amount) internal {
        if (srcRep != dstRep && amount > 0) {
            if (srcRep != address(0)) {
                _decreaseVotingPower(srcRep, amount);
            }

            if (dstRep != address(0)) {
                _increaseVotingPower(dstRep, amount);
            }
        }
    }

    function _writeCheckpoint(address voter, uint32 nCheckpoints, uint256 oldVotes, uint256 newVotes) internal {
      uint32 blockNumber = safe32(block.number, "Arch::_writeCheckpoint: block number exceeds 32 bits");

      CheckpointStorage storage cs = VotingPowerStorage.checkpointStorage();
      if (nCheckpoints > 0 && cs.checkpoints[voter][nCheckpoints - 1].fromBlock == blockNumber) {
          cs.checkpoints[voter][nCheckpoints - 1].votes = newVotes;
      } else {
          cs.checkpoints[voter][nCheckpoints] = Checkpoint(blockNumber, newVotes);
          cs.numCheckpoints[voter] = nCheckpoints + 1;
      }

      emit VotingPowerChanged(voter, oldVotes, newVotes);
    }

    function safe32(uint n, string memory errorMessage) internal pure returns (uint32) {
        require(n < 2**32, errorMessage);
        return uint32(n);
    }

    function become(VotingPowerProxy proxy) public {
        require(msg.sender == proxy.proxyAdmin(), "only proxy admin can change implementation");
        require(proxy.acceptImplementation() == true, "change not authorized");
    }
}