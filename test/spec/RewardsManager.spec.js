const { expect } = require("chai")
const { ethers } = require("hardhat");
const { rewardsFixture } = require("../fixtures")

const INITIAL_ARCH_REWARDS_BALANCE = process.env.INITIAL_ARCH_REWARDS_BALANCE
const MASTERCHEF_POOL_ID = process.env.MASTERCHEF_POOL_ID
const UNI_POOL_ADDRESS = process.env.UNI_POOL_ADDRESS
const ADMIN_ADDRESS = process.env.ADMIN_ADDRESS
const ARCH_REWARDS_PER_BLOCK = process.env.ARCH_REWARDS_PER_BLOCK
const FACTOR = ethers.BigNumber.from("10").pow("12")



describe('RewardsManager', () => {
    let archToken
    let rewardsManager
    let vault
    let votingPower
    let lockManager
    let masterChef
    let sushiPool
    let sushiRouter
    let deployer
    let admin
    let alice
    let bob

    beforeEach(async () => {
        const fix = await rewardsFixture()
        archToken = fix.archToken
        votingPower = fix.votingPower
        rewardsManager = fix.rewardsManager
        vault = fix.vault
        lockManager = fix.lockManager
        masterChef = fix.masterChef
        sushiPool = fix.sushiPool
        sushiRouter = fix.sushiRouter
        deployer = fix.deployer
        admin = fix.admin
        alice = fix.alice
        bob = fix.bob
    })
  
    context('add', async () => {
        it('successfully adds a valid sushi pool', async () => {
            const ALLOC_POINTS = "10"
            const VESTING_PERCENT = "500000"
            const VESTING_PERIOD = "180"
            const numPools = await rewardsManager.poolLength()
            const numTotalAllocPoints = await rewardsManager.totalAllocPoint()
            await rewardsManager.connect(admin).add(ALLOC_POINTS, sushiPool.address, VESTING_PERCENT, VESTING_PERIOD, true, MASTERCHEF_POOL_ID)
            expect(await rewardsManager.poolLength()).to.eq(numPools.add(1))
            expect(await rewardsManager.totalAllocPoint()).to.eq(numTotalAllocPoints.add(ALLOC_POINTS))
            expect(await rewardsManager.sushiPools(sushiPool.address)).to.eq(MASTERCHEF_POOL_ID)
            const newPool = await rewardsManager.poolInfo(numPools)
            expect(newPool.token).to.eq(sushiPool.address)
            expect(newPool.allocPoint).to.eq(ALLOC_POINTS)
            expect(newPool.vestingPercent.toString()).to.eq(VESTING_PERCENT)
            expect(newPool.vestingPeriod.toString()).to.eq(VESTING_PERIOD)
        })

        it('successfully adds a valid uni pool', async () => {
            const ALLOC_POINTS = "10"
            const VESTING_PERCENT = "500000"
            const VESTING_PERIOD = "180"
            const numPools = await rewardsManager.poolLength()
            const numTotalAllocPoints = await rewardsManager.totalAllocPoint()
            await rewardsManager.connect(admin).add(ALLOC_POINTS, UNI_POOL_ADDRESS, VESTING_PERCENT, VESTING_PERIOD, true, 0)
            expect(await rewardsManager.poolLength()).to.eq(numPools.add(1))
            expect(await rewardsManager.totalAllocPoint()).to.eq(numTotalAllocPoints.add(ALLOC_POINTS))
            expect(await rewardsManager.sushiPools(UNI_POOL_ADDRESS)).to.eq(0)
            const newPool = await rewardsManager.poolInfo(numPools)
            expect(newPool.token).to.eq(UNI_POOL_ADDRESS)
            expect(newPool.allocPoint).to.eq(ALLOC_POINTS)
            expect(newPool.vestingPercent.toString()).to.eq(VESTING_PERCENT)
            expect(newPool.vestingPeriod.toString()).to.eq(VESTING_PERIOD)
        })

        it('does not allow non-owner to add sushi pool', async () => {
            const ALLOC_POINTS = "10"
            const VESTING_PERCENT = "500000"
            const VESTING_PERIOD = "180"
            await expect(rewardsManager.add(ALLOC_POINTS, sushiPool.address, VESTING_PERCENT, VESTING_PERIOD, true, MASTERCHEF_POOL_ID)).to.revertedWith("not owner")
        })
    })

    context('set', async () => {
        beforeEach(async () => {
            const ALLOC_POINTS = "10"
            const VESTING_PERCENT = "500000"
            const VESTING_PERIOD = "180"
            await rewardsManager.connect(admin).add(ALLOC_POINTS, sushiPool.address, VESTING_PERCENT, VESTING_PERIOD, true, MASTERCHEF_POOL_ID)
        })

        it('allows owner to set alloc points for pool', async () => {
            const ALLOC_POINTS = "20"
            const numPools = await rewardsManager.poolLength()
            const pid = numPools.sub(1)
            await rewardsManager.connect(admin).set(pid, ALLOC_POINTS, true)
            const pool = await rewardsManager.poolInfo(pid)
            expect(pool.allocPoint).to.eq(ALLOC_POINTS)
        })

        it('does not allow non-owner to set alloc points for pool', async () => {
            const ALLOC_POINTS = "20"
            const numPools = await rewardsManager.poolLength()
            const pid = numPools.sub(1)
            await expect(rewardsManager.set(pid, ALLOC_POINTS, true)).to.revertedWith("not owner")
        })
    })

    context('toggleRewards', async () => {
        it('allows owner to toggle rewards', async () => {
            const rewardsEnabled = await rewardsManager.rewardsEnabled()
            await rewardsManager.connect(admin).toggleRewards()
            if (rewardsEnabled) {
                expect(await rewardsManager.rewardsEnabled()).to.eq(false)
                await rewardsManager.connect(admin).toggleRewards()
                expect(await rewardsManager.rewardsEnabled()).to.eq(true)
            } else {
                expect(await rewardsManager.rewardsEnabled()).to.eq(true)
                await rewardsManager.connect(admin).toggleRewards()
                expect(await rewardsManager.rewardsEnabled()).to.eq(false)
            }
        })

        it('does not allow non-owner to toggle rewards', async () => {
            await expect(rewardsManager.toggleRewards()).to.revertedWith("not owner")
        })
    })

    context('rewardsActive', async () => {
        it('returns true if rewards enabled and balance of ARCH in contract', async () => {
            const rewardsEnabled = await rewardsManager.rewardsEnabled()
            const contractBalance = await archToken.balanceOf(rewardsManager.address)
            if (rewardsEnabled && contractBalance > 0) {
                expect(await rewardsManager.rewardsActive()).to.eq(true)
            } else {
                expect(await rewardsManager.rewardsActive()).to.eq(false)
            }
        })
    })

    context('deposit', async () => {
        beforeEach(async () => {
            const ALLOC_POINTS = "10"
            const VESTING_PERCENT = "500000"
            const VESTING_PERIOD = "180"
            const TOKEN_LIQUIDITY = "100000000000000000000"
            const ETH_LIQUIDITY = "500000000000000000"
            await rewardsManager.connect(admin).add(ALLOC_POINTS, sushiPool.address, VESTING_PERCENT, VESTING_PERIOD, true, MASTERCHEF_POOL_ID)
            await lockManager.grantRole(ethers.utils.keccak256(ethers.utils.toUtf8Bytes("LOCKER_ROLE")), rewardsManager.address)
            await lockManager.grantRole(ethers.utils.keccak256(ethers.utils.toUtf8Bytes("LOCKER_ROLE")), vault.address)
            await archToken.approve(sushiRouter.address, TOKEN_LIQUIDITY)
            await sushiRouter.addLiquidityETH(archToken.address, TOKEN_LIQUIDITY, "0", "0", deployer.address, ethers.constants.MaxUint256, { from: deployer.address, value: ETH_LIQUIDITY, gasLimit: 6000000 })
        })
        it('creates a valid deposit for a sushi pool', async () => {
            const numPools = await rewardsManager.poolLength()
            const poolIndex = numPools.sub(1)
            const slpBalance = await sushiPool.balanceOf(deployer.address)
            let masterChefSLPBalanceBefore = await sushiPool.balanceOf(masterChef.address)
            const sushiPerBlock = await masterChef.sushiPerBlock()
            const masterChefTotalAlloc = await masterChef.totalAllocPoint()
            await sushiPool.approve(rewardsManager.address, slpBalance)
            let blockNumber = await ethers.provider.getBlockNumber()
            let masterChefPool = await masterChef.poolInfo(MASTERCHEF_POOL_ID)
            let masterChefPoolAlloc = masterChefPool.allocPoint
            let masterChefLastRewardBlock = masterChefPool.lastRewardBlock
            const multiplier = ethers.BigNumber.from(blockNumber).add(1).sub(masterChefLastRewardBlock)
            const sushiReward = multiplier.mul(sushiPerBlock).mul(masterChefPoolAlloc).div(masterChefTotalAlloc)
            const accSushiPerShare = masterChefPool.accSushiPerShare.add(sushiReward.mul(FACTOR).div(masterChefSLPBalanceBefore))
            await rewardsManager.deposit(poolIndex, slpBalance)
            const pool = await rewardsManager.poolInfo(poolIndex)
            const user = await rewardsManager.userInfo(poolIndex, deployer.address)
            expect(pool.totalStaked).to.eq(slpBalance)
            expect(user.amount).to.eq(slpBalance)
            expect(user.archRewardDebt).to.eq(0)
            expect(user.sushiRewardDebt).to.eq(slpBalance.mul(accSushiPerShare).div(FACTOR))
            expect(await lockManager.getAmountStaked(deployer.address, sushiPool.address)).to.eq(slpBalance)
            expect(await sushiPool.balanceOf(masterChef.address)).to.eq(masterChefSLPBalanceBefore.add(slpBalance))
            expect(await votingPower.balanceOf(deployer.address)).to.eq(slpBalance.mul("80").div("100"))
        })

        it('creates multiple valid deposits for sushi pools', async () => {
            const numPools = await rewardsManager.poolLength()
            const poolIndex = numPools.sub(1)
            const slpBalance = await sushiPool.balanceOf(deployer.address)
            const stakeAmount = slpBalance.div(2)
            let masterChefSLPBalanceBefore = await sushiPool.balanceOf(masterChef.address)
            await sushiPool.approve(rewardsManager.address, slpBalance)
            await rewardsManager.deposit(poolIndex, stakeAmount)

            let user = await rewardsManager.userInfo(poolIndex, deployer.address)
            const accRewardsPerShare = ethers.BigNumber.from(ARCH_REWARDS_PER_BLOCK).mul(FACTOR).div(stakeAmount)
            const pendingArch = stakeAmount.mul(accRewardsPerShare).div(FACTOR)
            expect(user.amount).to.eq(stakeAmount)
            expect(user.archRewardDebt).to.eq(0)
            expect(await lockManager.getAmountStaked(deployer.address, sushiPool.address)).to.eq(stakeAmount)
            await rewardsManager.deposit(poolIndex, stakeAmount)

            const pool = await rewardsManager.poolInfo(poolIndex)
            const masterChefUser = await masterChef.userInfo(MASTERCHEF_POOL_ID, rewardsManager.address)
            user = await rewardsManager.userInfo(poolIndex, deployer.address)
            expect(pool.totalStaked).to.eq(slpBalance)
            expect(user.amount).to.eq(slpBalance)
            const expectedArchRewardDebt = slpBalance.mul(pool.accRewardsPerShare).div(FACTOR)
            expect(user.archRewardDebt).to.eq(expectedArchRewardDebt)
            expect(user.sushiRewardDebt).to.eq(masterChefUser.rewardDebt)
            expect(await lockManager.getAmountStaked(deployer.address, sushiPool.address)).to.eq(slpBalance)
            expect(await sushiPool.balanceOf(masterChef.address)).to.eq(masterChefSLPBalanceBefore.add(slpBalance))
            const baseVotingPower = stakeAmount.mul("80").div("100").mul(2)
            const vestingArch = pendingArch.mul("50").div("100")
            const expectedVotingPower = baseVotingPower.add(vestingArch)
            expect(await votingPower.balanceOf(deployer.address)).to.eq(expectedVotingPower)
        })
    })
  })