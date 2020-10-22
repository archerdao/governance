// SPDX-License-Identifier: MIT
pragma solidity ^0.7.0;
pragma experimental ABIEncoderV2;

import "./lib/SafeMath.sol";
import "./lib/Initializable.sol";
import "./lib/ReentrancyGuardUpgradeSafe.sol";
import "./lib/VotingPowerStorageWithDelegation.sol";
import "./VotingPowerProxyWithDelegation.sol";
import "./interfaces/IERC20.sol";


contract VotingPower is Initializable, ReentrancyGuardUpgradeSafe {
    using SafeMath for uint256;

    /// @notice An event that's emitted when a user's staked balance increases
    event Staked(address indexed user, address token, uint256 amount);

    /// @notice An event that's emitted when a user's staked balance decreases
    event Withdrawn(address indexed user, address token, uint256 amount);

    /// @notice An event that's emitted when an account's vote balance changes
    event VotingPowerChanged(address indexed voter, uint previousBalance, uint newBalance);

    /// @notice An event thats emitted when an account changes its delegate
    event DelegationChanged(address indexed delegator, address indexed fromDelegate, address indexed toDelegate, uint256 previousDelegatedBalance, uint256 newDelegatedBalance);

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

        _stake(address(app.archToken), amount, amount);
    }

    /**
     * @notice Stake ARCH tokens to unlock voting power for `msg.sender`
     * @param amount The amount to stake
     */
    function stake(uint256 amount) external nonReentrant {
        AppStorage storage app = VotingPowerStorage.appStorage();
        require(amount > 0, "Cannot stake 0");
        require(app.archToken.allowance(msg.sender, address(this)) >= amount, "Must approve tokens before staking");

        _stake(address(app.archToken), amount, amount);
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
        AppStorage storage app = VotingPowerStorage.appStorage();
        _withdraw(address(app.archToken), amount, amount);
    }

    /**
     * @notice Get total amount of ARCH tokens staked in contract
     */
    function totalARCHStaked() public view returns (uint256) {
        AppStorage storage app = VotingPowerStorage.appStorage();
        return totalStaked(address(app.archToken));
    }

    /**
     * @notice Get total amount of tokens staked in contract
     * @param _stakedToken The staked token
     */
    function totalStaked(address _stakedToken) public view returns (uint256) {
        StakeStorage storage ss = VotingPowerStorage.stakeStorage();
        return ss.totalStaked[_stakedToken];
    }

    /**
     * @notice Delegate votes from `msg.sender` to `delegatee`
     * @param delegatee The address to delegate votes to
     */
    function delegate(address delegatee) public nonReentrant {
        return _delegate(msg.sender, delegatee);
    }

    /**
     * @notice Delegates votes from signatory to `delegatee`
     * @param delegatee The address to delegate votes to
     * @param nonce The contract state required to match the signature
     * @param expiry The time at which to expire the signature
     * @param v The recovery byte of the signature
     * @param r Half of the ECDSA signature pair
     * @param s Half of the ECDSA signature pair
     */
    function delegateBySig(address delegatee, uint nonce, uint expiry, uint8 v, bytes32 r, bytes32 s) public nonReentrant {
        AppStorage storage app = VotingPowerStorage.appStorage();
        bytes32 domainSeparator = keccak256(abi.encode(VotingPowerStorage.domainTypeHash(), keccak256(bytes(app.archToken.name())), _getChainId(), address(this)));
        bytes32 structHash = keccak256(abi.encode(VotingPowerStorage.delegationTypeHash(), delegatee, nonce, expiry));
        bytes32 digest = keccak256(abi.encodePacked("\x19\x01", domainSeparator, structHash));
        address signatory = ecrecover(digest, v, r, s);
        require(signatory != address(0), "Arch::delegateBySig: invalid signature");
        require(nonce == app.nonces[signatory]++, "Arch::delegateBySig: invalid nonce");
        require(block.timestamp <= expiry, "Arch::delegateBySig: signature expired");
        return _delegate(signatory, delegatee);
    }

    /**
     * @notice Gets the current votes balance for `account`
     * @param account The address to get votes balance
     * @return The number of current votes for `account`
     */
    function getCurrentVotes(address account) public view returns (uint256) {
        CheckpointStorage storage cs = VotingPowerStorage.checkpointStorage();
        uint32 nCheckpoints = cs.numCheckpoints[account];
        return nCheckpoints > 0 ? cs.checkpoints[account][nCheckpoints - 1].votes : 0;
    }

    /**
     * @notice Gets the current number of votes delegated to `account`
     * @param account The address to get delegated votes balance
     * @return The number of current votes delegated to `account`
     */
    function getVotesDelegatedTo(address account) public view returns (uint256) {
        DelegateStorage storage ds = VotingPowerStorage.delegateStorage();
        return ds.delegatedVotes[account];
    }

    /**
     * @notice Gets the current number of votes delegated from `account`
     * @param account The address to get delegated votes balance
     * @return The number of current votes delegated from `account`
     */
    function getVotesDelegatedFrom(address account) public view returns (uint256) {
        DelegateStorage storage ds = VotingPowerStorage.delegateStorage();
        return ds.delegations[account].amount;
    }

    /**
     * @notice Gets the current number of votes `account` has available to delegate
     * @param account The address to get delegable votes balance
     * @return The number of current votes `account` can delegate
     */
    function getDelegableVotes(address account) public view returns (uint256) {
        return getCurrentVotes(account).add(getVotesDelegatedFrom(account)).sub(getVotesDelegatedTo(account));
    }

    /**
     * @notice Gets the current delegate for `account`
     * @param account The address to get current delegate
     * @return The current delegate for `account`, if no delegate exists - returns `account`
     */
    function getCurrentDelegate(address account) public view returns (address) {
        DelegateStorage storage ds = VotingPowerStorage.delegateStorage();
        address currentDelegate = ds.delegations[account].delegate;
        return currentDelegate != address(0) ? currentDelegate : account;
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

    function _stake(address token, uint256 tokenAmount, uint256 votingPower) internal {
        StakeStorage storage ss = VotingPowerStorage.stakeStorage();
        ss.totalStaked[token].add(tokenAmount);
        ss.stakes[msg.sender][token].add(tokenAmount);

        IERC20(token).transferFrom(msg.sender, address(this), tokenAmount);

        emit Staked(msg.sender, token, tokenAmount);

        _increaseVotingPower(msg.sender, votingPower);
    }

    function _withdraw(address token, uint256 tokenAmount, uint256 votingPower) internal {
        StakeStorage storage ss = VotingPowerStorage.stakeStorage();
        ss.totalStaked[token].sub(tokenAmount);
        ss.stakes[msg.sender][token].sub(tokenAmount);
        
        IERC20(token).transfer(msg.sender, tokenAmount);

        emit Withdrawn(msg.sender, token, tokenAmount);
        
        _decreaseVotingPower(msg.sender, votingPower);
    }

    function _increaseVotingPower(address voter, uint256 amount) internal {
        CheckpointStorage storage cs = VotingPowerStorage.checkpointStorage();
        uint32 checkpointNum = cs.numCheckpoints[voter];
        uint256 votingPowerOld = checkpointNum > 0 ? cs.checkpoints[voter][checkpointNum - 1].votes : 0;
        uint256 votingPowerNew = votingPowerOld.add(amount);
        _writeCheckpoint(voter, checkpointNum, votingPowerOld, votingPowerNew);
    }

    function _decreaseVotingPower(address voter, uint256 amount) internal {
        CheckpointStorage storage cs = VotingPowerStorage.checkpointStorage();
        uint32 checkpointNum = cs.numCheckpoints[voter];
        uint256 votingPowerOld = checkpointNum > 0 ? cs.checkpoints[voter][checkpointNum - 1].votes : 0;
        uint256 votingPowerNew = votingPowerOld.sub(amount);
        _writeCheckpoint(voter, checkpointNum, votingPowerOld, votingPowerNew);
    }

    function _delegate(address delegator, address delegatee) internal {
        uint256 delegableVotes = getDelegableVotes(delegator);
        require(delegableVotes > 0, "No votes to delegate");

        DelegateStorage storage ds = VotingPowerStorage.delegateStorage();
        Delegation memory currentDelegation = ds.delegations[delegator];
        address currentDelegate = currentDelegation.delegate;
        uint256 currentDelegatedAmount = currentDelegation.amount;

        ds.delegations[delegator] = Delegation(delegatee, delegableVotes);
        ds.delegatedVotes[delegatee].add(delegableVotes);

        emit DelegationChanged(delegator, currentDelegate, delegatee, currentDelegatedAmount, delegableVotes);

        _moveDelegates(currentDelegate, delegatee, currentDelegatedAmount, delegableVotes);
    }

    function _moveDelegates(address srcRep, address dstRep, uint256 oldDelegatedAmount, uint256 newDelegatedAmount) internal {
        if (srcRep != dstRep) {
            if (srcRep != address(0) && oldDelegatedAmount > 0) {
                _decreaseVotingPower(srcRep, oldDelegatedAmount);
            }

            if (dstRep != address(0) && newDelegatedAmount > 0) {
                _increaseVotingPower(dstRep, newDelegatedAmount);
            }
        }
    }

    function _writeCheckpoint(address voter, uint32 nCheckpoints, uint256 oldVotes, uint256 newVotes) internal {
      uint32 blockNumber = _safe32(block.number, "Arch::_writeCheckpoint: block number exceeds 32 bits");

      CheckpointStorage storage cs = VotingPowerStorage.checkpointStorage();
      if (nCheckpoints > 0 && cs.checkpoints[voter][nCheckpoints - 1].fromBlock == blockNumber) {
          cs.checkpoints[voter][nCheckpoints - 1].votes = newVotes;
      } else {
          cs.checkpoints[voter][nCheckpoints] = Checkpoint(blockNumber, newVotes);
          cs.numCheckpoints[voter] = nCheckpoints + 1;
      }

      emit VotingPowerChanged(voter, oldVotes, newVotes);
    }

    function _safe32(uint n, string memory errorMessage) internal pure returns (uint32) {
        require(n < 2**32, errorMessage);
        return uint32(n);
    }

    function _getChainId() internal pure returns (uint) {
        uint256 chainId;
        assembly { chainId := chainid() }
        return chainId;
    }

    function become(VotingPowerProxy proxy) public {
        require(msg.sender == proxy.proxyAdmin(), "only proxy admin can change implementation");
        require(proxy.acceptImplementation() == true, "change not authorized");
    }
}