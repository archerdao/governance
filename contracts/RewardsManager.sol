// SPDX-License-Identifier: MIT
pragma solidity ^0.7.0;
pragma experimental ABIEncoderV2;

import "./interfaces/IArchToken.sol";
import "./interfaces/IVotingPower.sol";
import "./interfaces/IMasterChef.sol";
import "./interfaces/IVault.sol";
import "./interfaces/ILockManager.sol";
import "./lib/SafeMath.sol";
import "./lib/SafeERC20.sol";

import "hardhat/console.sol";

/**
 * @title RewardsManager
 * @dev Controls rewards distribution for ARCH network
 */
contract RewardsManager {
    using SafeMath for uint256;
    using SafeERC20 for IERC20;

    /// @notice Current owner of this contract
    address public owner;

    /// @notice Voting power contract
    IVotingPower public votingPower;

    /// @notice Info of each user.
    struct UserInfo {
        uint256 amount;     // How many tokens the user has provided.
        uint256 archRewardDebt; // Reward debt for ARCH rewards. See explanation below.
        uint256 sushiRewardDebt; // Reward debt for Sushi rewards. See explanation below.
        //
        // We do some fancy math here. Basically, any point in time, the amount of reward tokens
        // entitled to a user but is pending to be distributed is:
        //
        //   pending reward = (user.amount * pool.accRewardsPerShare) - user.rewardDebt
        //
        // Whenever a user deposits or withdraws tokens to a pool. Here's what happens:
        //   1. The pool's `accRewardsPerShare` (and `lastRewardBlock`) gets updated.
        //   2. User receives the pending reward sent to his/her address.
        //   3. User's `amount` gets updated.
        //   4. User's `rewardDebt` gets updated.
    }

    /// @notice Info of each pool.
    struct PoolInfo {
        IERC20 token;               // Address of token contract.
        uint256 allocPoint;         // How many allocation points assigned to this pool. Reward tokens to distribute per block.
        uint256 lastRewardBlock;    // Last block number where reward tokens were distributed.
        uint256 accRewardsPerShare; // Accumulated reward tokens per share, times 1e12. See below.
        uint32 vestingPercent;      // Percentage of rewards that vest (measured in bips: 500,000 bips = 50% of rewards)
        uint16 vestingPeriod;       // Vesting period in days for vesting rewards
        uint256 totalStaked;        // Total amount of token staked via Rewards Manager
    }

    /// @notice ARCH token
    IArchToken public archToken;

    /// @notice SUSHI token
    IERC20 public sushiToken;

    /// @notice Sushi Master Chef
    IMasterChef public masterChef;

    /// @notice Vault for vesting tokens
    IVault public vault;

    /// @notice LockManager contract
    ILockManager public lockManager;

    /// @notice ARCH tokens rewarded per block.
    uint256 public archPerBlock;

    /// @notice Info of each pool.
    PoolInfo[] public poolInfo;
    
    /// @notice Mapping of Sushi tokens to MasterChef pids 
    mapping (address => uint256) public sushiPools;

    /// @notice Info of each user that stakes tokens.
    mapping (uint256 => mapping (address => UserInfo)) public userInfo;
    
    /// @notice Total allocation points. Must be the sum of all allocation points in all pools.
    uint256 public totalAllocPoint = 0;

    /// @notice The block number when ARCH rewards start.
    uint256 public startBlock;

    /// @notice If true, distribute ARCH rewards on deposits and withdrawals
    bool public rewardsEnabled = true;

    /// @notice only owner can call function
    modifier onlyOwner {
        require(msg.sender == owner, "not owner");
        _;
    }

    /// @notice Event emitted when a user deposits funds in the rewards manager
    event Deposit(address indexed user, uint256 indexed pid, uint256 amount);

    /// @notice Event emitted when a user withdraws their original funds + rewards from the rewards manager
    event Withdraw(address indexed user, uint256 indexed pid, uint256 amount);

    /// @notice Event emitted when a user withdraws their original funds from the rewards manager without claiming rewards
    event EmergencyWithdraw(address indexed user, uint256 indexed pid, uint256 amount);

    /// @notice Event emitted when new pool is added to the rewards manager
    event PoolAdded(uint256 indexed pid, address indexed token, uint256 allocPoints, uint256 totalAllocPoints, uint256 rewardStartBlock, uint256 sushiPid);
    
    /// @notice Event emitted when the owner of the rewards manager contract is updated
    event ChangedOwner(address indexed oldOwner, address indexed newOwner);

    constructor(
        address _owner, 
        address _lockManager,
        address _vault,
        address _arch,
        address _sushiToken,
        address _masterChef,
        uint256 _archPerBlock,
        uint256 _startBlock
    ) {
        archToken = IArchToken(_arch);
        sushiToken = IERC20(_sushiToken);
        masterChef = IMasterChef(_masterChef);
        lockManager = ILockManager(_lockManager);
        vault = IVault(_vault);
        archPerBlock = _archPerBlock;
        startBlock = _startBlock;
        owner = _owner;
        archToken.approve(address(vault), uint256(-1));
        emit ChangedOwner(address(0), owner);
    }

    // TODO: Add setter for archPerBlock

    /**
     * @notice View function to see current poolInfo array length
     * @return pool length
     */
    function poolLength() external view returns (uint256) {
        return poolInfo.length;
    }

    /**
     * @notice Add a new reward token to the pool
     * @dev Can only be called by the owner. DO NOT add the same token more than once. Rewards will be messed up if you do.
     * @param allocPoint Number of allocation points to allot to this token/pool
     * @param token The token that will be staked for rewards
     * @param vestingPercent The percentage of rewards from this pool that will vest
     * @param vestingPeriod The number of days for the vesting period
     * @param withUpdate if specified, update all pools before adding new pool
     * @param sushiPid The pid of the Sushiswap pool in the Masterchef contract (if exists, otherwise provide zero)
     */
    function add(
        uint256 allocPoint, 
        address token,
        uint32 vestingPercent,
        uint16 vestingPeriod,
        bool withUpdate,
        uint256 sushiPid
    ) public onlyOwner {
        if (withUpdate) {
            massUpdatePools();
        }
        uint256 rewardStartBlock = block.number > startBlock ? block.number : startBlock;
        totalAllocPoint = totalAllocPoint.add(allocPoint);
        poolInfo.push(PoolInfo({
            token: IERC20(token),
            allocPoint: allocPoint,
            lastRewardBlock: rewardStartBlock,
            accRewardsPerShare: 0,
            vestingPercent: vestingPercent,
            vestingPeriod: vestingPeriod,
            totalStaked: 0
        }));
        if (sushiPid != uint256(0)) {
            sushiPools[token] = sushiPid;
            IERC20(token).safeIncreaseAllowance(address(masterChef), uint256(-1));
        }
        IERC20(token).safeIncreaseAllowance(address(vault), uint256(-1));
        emit PoolAdded(poolInfo.length - 1, token, allocPoint, totalAllocPoint, rewardStartBlock, sushiPid);
    }

    /**
     * @notice Update the given pool's ARCH allocation points
     * @dev Can only be called by the owner
     * @param pid The RewardManager pool id
     * @param allocPoint New number of allocation points for pool
     * @param withUpdate if specified, update all pools before setting allocation points
     */
    function set(uint256 pid, uint256 allocPoint, bool withUpdate) public onlyOwner {
        if (withUpdate) {
            massUpdatePools();
        }
        totalAllocPoint = totalAllocPoint.sub(poolInfo[pid].allocPoint).add(allocPoint);
        poolInfo[pid].allocPoint = allocPoint;
    }

    /**
     * @notice Turn ARCH rewards on and off
     * @dev Can only be called by the owner
     * @return Rewards state after calling function
     */
    function toggleRewards() public onlyOwner returns (bool) {
        rewardsEnabled ? rewardsEnabled = false : rewardsEnabled = true;
        return rewardsEnabled;
    }

    function rewardsActive() public view returns (bool) {
        if (rewardsEnabled && archToken.balanceOf(address(this)) > 0) {
            return true;
        }
        return false;
    }

    /**
     * @notice Return reward multiplier over the given from to to block.
     * @param from From block number
     * @param to To block number
     * @return multiplier
     */
    function getMultiplier(uint256 from, uint256 to) public pure returns (uint256) {
        return to > from ? to.sub(from) : 0;
    }

    /**
     * @notice View function to see pending ARCH on frontend.
     * @param pid pool id
     * @param account user account to check
     * @return pending ARCH rewards
     */
    function pendingArch(uint256 pid, address account) external view returns (uint256) {
        if (!rewardsActive()) {
            return 0;
        }
        PoolInfo storage pool = poolInfo[pid];
        UserInfo storage user = userInfo[pid][account];
        uint256 accRewardsPerShare = pool.accRewardsPerShare;
        uint256 tokenSupply = pool.totalStaked;
        if (block.number > pool.lastRewardBlock && tokenSupply != 0) {
            uint256 multiplier = getMultiplier(pool.lastRewardBlock, block.number);
            uint256 archReward = multiplier.mul(archPerBlock).mul(pool.allocPoint).div(totalAllocPoint);
            accRewardsPerShare = accRewardsPerShare.add(archReward.mul(1e12).div(tokenSupply));
        }
        return user.amount.mul(accRewardsPerShare).div(1e12).sub(user.archRewardDebt);
    }

    /**
     * @notice View function to see pending SUSHI on frontend.
     * @param pid pool id
     * @param account user account to check
     * @return pending SUSHI rewards
     */
    function pendingSushi(uint256 pid, address account) external view returns (uint256) {
        PoolInfo storage pool = poolInfo[pid];
        UserInfo storage user = userInfo[pid][account];
        uint256 sushiPid = sushiPools[address(pool.token)];
        if (sushiPid == uint256(0)) {
            return 0;
        }
        IMasterChef.PoolInfo memory sushiPool = masterChef.poolInfo(sushiPid);
        uint256 sushiPerBlock = masterChef.sushiPerBlock();
        uint256 totalSushiAllocPoint = masterChef.totalAllocPoint();
        uint256 accSushiPerShare = sushiPool.accSushiPerShare;
        uint256 lpSupply = sushiPool.lpToken.balanceOf(address(masterChef));
        if (block.number > sushiPool.lastRewardBlock && lpSupply != 0) {
            uint256 multiplier = masterChef.getMultiplier(sushiPool.lastRewardBlock, block.number);
            uint256 sushiReward = multiplier.mul(sushiPerBlock).mul(sushiPool.allocPoint).div(totalSushiAllocPoint);
            accSushiPerShare = accSushiPerShare.add(sushiReward.mul(1e12).div(lpSupply));
        }
        return user.amount.mul(accSushiPerShare).div(1e12).sub(user.sushiRewardDebt);
        // TODO: determine if logic is correct - check sushiRewardDebt user vs contract 
        // return user.amount.mul(masterChef.poolInfo(sushiPid).accSushiPerShare).div(1e12).sub(user.sushiRewardDebt);
    }

    /**
     * @notice Update reward variables for all pools
     * @dev Be careful of gas spending!
     */
    function massUpdatePools() public {
        for (uint256 pid = 0; pid < poolInfo.length; ++pid) {
            updatePool(pid);
        }
    }

    /**
     * @notice Update reward variables of the given pool to be up-to-date
     * @param pid pool id
     */
    function updatePool(uint256 pid) public {
        PoolInfo storage pool = poolInfo[pid];
        if (block.number <= pool.lastRewardBlock) {
            return;
        }
        uint256 tokenSupply = pool.totalStaked;
        if (tokenSupply == 0) {
            pool.lastRewardBlock = block.number;
            return;
        }
        uint256 multiplier = getMultiplier(pool.lastRewardBlock, block.number);
        uint256 archReward = multiplier.mul(archPerBlock).mul(pool.allocPoint).div(totalAllocPoint);
        pool.accRewardsPerShare = pool.accRewardsPerShare.add(archReward.mul(1e12).div(tokenSupply));
        pool.lastRewardBlock = block.number;
    }

    /**
     * @notice Deposit tokens to RewardsManager for ARCH allocation.
     * @param pid pool id
     * @param amount number of tokens to deposit
     */
    // TODO: Review for reentrancy issues
    function deposit(uint256 pid, uint256 amount) public {
        PoolInfo storage pool = poolInfo[pid];
        UserInfo storage user = userInfo[pid][msg.sender];
        uint256 sushiPid = sushiPools[address(pool.token)];

        updatePool(pid);

        uint256 pendingSushiTokens = 0;

        if (user.amount > 0) {
            if(rewardsActive()) {
                uint256 pendingArchTokens = user.amount.mul(pool.accRewardsPerShare).div(1e12).sub(user.archRewardDebt);
                _distributeArchRewards(msg.sender, pendingArchTokens, pool.vestingPercent, pool.vestingPeriod);
            }

            if (sushiPid != uint256(0)) {
                pendingSushiTokens = user.amount.mul(masterChef.poolInfo(sushiPid).accSushiPerShare).div(1e12).sub(user.sushiRewardDebt);
            }
        }
       
        pool.token.safeTransferFrom(msg.sender, address(this), amount);
        pool.totalStaked = pool.totalStaked.add(amount);

        user.amount = user.amount.add(amount);
        user.archRewardDebt = user.amount.mul(pool.accRewardsPerShare).div(1e12);
        if (sushiPid != uint256(0)) {
            masterChef.updatePool(sushiPid);
            user.sushiRewardDebt = user.amount.mul(masterChef.poolInfo(sushiPid).accSushiPerShare).div(1e12);
            masterChef.deposit(sushiPid, amount);
        }

        lockManager.grantVotingPower(msg.sender, address(pool.token), amount);

        if (pendingSushiTokens > 0) {
            _safeSushiTransfer(msg.sender, pendingSushiTokens);
        }

        emit Deposit(msg.sender, pid, amount);
    }

    /**
     * @notice Withdraw tokens from RewardsManager, claiming rewards.
     * @param pid pool id
     * @param amount number of tokens to withdraw
     */
    // TODO: Review for reentrancy issues
    function withdraw(uint256 pid, uint256 amount) public {
        PoolInfo storage pool = poolInfo[pid];
        UserInfo storage user = userInfo[pid][msg.sender];
        require(user.amount >= amount, "RM::withdraw: amount > user balance");

        uint256 sushiPid = sushiPools[address(pool.token)];
        uint256 pendingSushiTokens = 0;

        updatePool(pid);

        if (rewardsActive()) {
            uint256 pendingArchTokens = user.amount.mul(pool.accRewardsPerShare).div(1e12).sub(user.archRewardDebt);
            _distributeArchRewards(msg.sender, pendingArchTokens, pool.vestingPercent, pool.vestingPeriod);
        }
    
        if (sushiPid != uint256(0)) {
            console.log("accSushiPerShare before: ", masterChef.poolInfo(sushiPid).accSushiPerShare);
            masterChef.updatePool(sushiPid);
            console.log("accSushiPerShare after update: ", masterChef.poolInfo(sushiPid).accSushiPerShare);
            pendingSushiTokens = user.amount.mul(masterChef.poolInfo(sushiPid).accSushiPerShare).div(1e12).sub(user.sushiRewardDebt);
            user.sushiRewardDebt = user.amount.mul(masterChef.poolInfo(sushiPid).accSushiPerShare).div(1e12);
            masterChef.withdraw(sushiPid, amount);
            console.log("accSushiPerShare after withdrawal: ", masterChef.poolInfo(sushiPid).accSushiPerShare);
        }
        
        user.amount = user.amount.sub(amount);
        user.archRewardDebt = user.amount.mul(pool.accRewardsPerShare).div(1e12);

        lockManager.removeVotingPower(msg.sender, address(pool.token), amount);

        if (pendingSushiTokens > 0) {
            _safeSushiTransfer(msg.sender, pendingSushiTokens);
        }

        pool.totalStaked = pool.totalStaked.sub(amount);
        pool.token.safeTransfer(msg.sender, amount);

        emit Withdraw(msg.sender, pid, amount);
    }

    /**
     * @notice Withdraw without caring about rewards. EMERGENCY ONLY.
     * @param pid pool id
     */
    function emergencyWithdraw(uint256 pid) public {
        PoolInfo storage pool = poolInfo[pid];
        UserInfo storage user = userInfo[pid][msg.sender];

        uint256 sushiPid = sushiPools[address(pool.token)];

        if (sushiPid != uint256(0)) {
            masterChef.withdraw(sushiPid, user.amount);
        }

        lockManager.removeVotingPower(msg.sender, address(pool.token), user.amount);

        pool.totalStaked = pool.totalStaked.sub(user.amount);
        pool.token.safeTransfer(address(msg.sender), user.amount);

        emit EmergencyWithdraw(msg.sender, pid, user.amount);

        user.amount = 0;
        user.archRewardDebt = 0;
        user.sushiRewardDebt = 0;
    }

    // TODO: add ability to harvest rewards without depositing or withdrawing
    // TODO: add ability for owner to rescue tokens stuck in the contract
    // TODO: add setters for contract storage vars

    /**
     * @notice Change owner of vesting contract
     * @param newOwner New owner address
     */
    function changeOwner(address newOwner) 
        external
    {
        require(msg.sender == owner, "RM::changeOwner: not owner");
        require(newOwner != address(0) && newOwner != address(this), "RM::changeOwner: not valid address");

        address oldOwner = owner;
        owner = newOwner;
        emit ChangedOwner(oldOwner, newOwner);
    }

    /**
     * @notice Internal function used to distrute ARCH rewards, optionally vesting a %
     * @param account account that is due rewards
     * @param amount amount of ARCH to distribute
     * @param vestingPercent percent of rewards to vest in bips
     * @param vestingPeriod number of days over which to vest rewards
     */
    function _distributeArchRewards(address account, uint256 amount, uint32 vestingPercent, uint16 vestingPeriod) internal {
        require(archToken.balanceOf(address(this)) >= amount, "RM::_distributeArchRewards: not enough ARCH in contract");
        uint256 vestingArch = amount.mul(vestingPercent).div(1000000);
        vault.lockTokens(address(archToken), address(this), account, 0, vestingArch, vestingPeriod, true);
        _safeArchTransfer(msg.sender, amount.sub(vestingArch));
    }

    /**
     * @notice Safe ARCH transfer function, just in case if rounding error causes pool to not have enough ARCH.
     * @param to account that is receieving ARCH
     * @param amount amount of ARCH to send
     */
    function _safeArchTransfer(address to, uint256 amount) internal {
        uint256 archBal = archToken.balanceOf(address(this));
        if (amount > archBal) {
            archToken.transfer(to, archBal);
        } else {
            archToken.transfer(to, amount);
        }
    }

    /**
     * @notice Safe SUSHI transfer function, just in case if rounding error causes pool to not have enough SUSHI.
     * @param to account that is receieving SUSHI
     * @param amount amount of SUSHI to send
     */
    function _safeSushiTransfer(address to, uint256 amount) internal {
        uint256 sushiBal = sushiToken.balanceOf(address(this));
        if (amount > sushiBal) {
            sushiToken.transfer(to, sushiBal);
        } else {
            sushiToken.transfer(to, amount);
        }
    }
}