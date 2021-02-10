const { ethers, deployments } = require("hardhat");
const { log } = deployments;
const DEPLOYER_ADDRESS = process.env.DEPLOYER_ADDRESS
const ADMIN_ADDRESS = process.env.ADMIN_ADDRESS
const DAO_TREASURY_ADDRESS = process.env.DAO_TREASURY_ADDRESS
const INITIAL_ARCH_REWARDS_BALANCE = process.env.INITIAL_ARCH_REWARDS_BALANCE
const FORK_URL = process.env.FORK_URL

async function configureRewardsManager() {
    if(FORK_URL && FORK_URL.length > 0) {
        await ethers.provider.send('hardhat_impersonateAccount', [DEPLOYER_ADDRESS]);
        await ethers.provider.send('hardhat_impersonateAccount', [ADMIN_ADDRESS]);
        await ethers.provider.send('hardhat_impersonateAccount', [DAO_TREASURY_ADDRESS]);
        const admin = await ethers.provider.getSigner(ADMIN_ADDRESS)
        const deployer = await ethers.getSigner(DEPLOYER_ADDRESS)
        const treasury = await ethers.provider.getSigner(DAO_TREASURY_ADDRESS)

        const ArchTokenDeployment = await deployments.get("ArchToken")
        const RewardsManagerDeployment = await deployments.get("RewardsManager")
        const LockManagerDeployment = await deployments.get("LockManager")
        const Vault = await deployments.get("Vault")
        const TokenRegistry = await deployments.get("TokenRegistry")
        const VotingPowerImpDeployment = await deployments.get("VotingPower")
        const VotingPowerPrismDeployment = await deployments.get("VotingPowerPrism")

        const ArchToken = new ethers.Contract(ArchTokenDeployment.address, ArchTokenDeployment.abi, admin)
        const LockManager = new ethers.Contract(LockManagerDeployment.address, LockManagerDeployment.abi, admin)
        const VotingPowerImp = new ethers.Contract(VotingPowerImpDeployment.address, VotingPowerImpDeployment.abi, admin)
        const VotingPowerPrism = new ethers.Contract(VotingPowerPrismDeployment.address, VotingPowerPrismDeployment.abi, admin)
        const VotingPower = new ethers.Contract(VotingPowerPrismDeployment.address, VotingPowerImpDeployment.abi, admin)
        const RewardsManager = new ethers.Contract(RewardsManagerDeployment.address, RewardsManagerDeployment.abi, admin)

        await deployer.sendTransaction({ to: DAO_TREASURY_ADDRESS, value: ethers.utils.parseEther("0.05")})
        await ArchToken.connect(treasury).transfer(ADMIN_ADDRESS, INITIAL_ARCH_REWARDS_BALANCE);
        await ethers.provider.send('hardhat_stopImpersonatingAccount', [DAO_TREASURY_ADDRESS]);
        await deployer.sendTransaction({ to: ADMIN_ADDRESS, value: ethers.utils.parseEther("0.05")})
        await VotingPowerPrism.setPendingProxyImplementation(VotingPowerImpDeployment.address);
        await VotingPowerImp.become(VotingPowerPrism.address);
        await VotingPower.changeOwner(ADMIN_ADDRESS)
        await VotingPower.setLockManager(LockManager.address)
        await VotingPower.setTokenRegistry(TokenRegistry.address)
        await LockManager.grantRole(ethers.utils.keccak256(ethers.utils.toUtf8Bytes("LOCKER_ROLE")), RewardsManager.address)
        await LockManager.grantRole(ethers.utils.keccak256(ethers.utils.toUtf8Bytes("LOCKER_ROLE")), Vault.address)
        await ArchToken.approve(RewardsManager.address, INITIAL_ARCH_REWARDS_BALANCE)
        await RewardsManager.addRewardsBalance(INITIAL_ARCH_REWARDS_BALANCE)
    } else {
        log("Must configure manually using multi-sig")
    }
}

if (require.main === module) {
    configureRewardsManager()
}

module.exports.configureRewardsManager = configureRewardsManager
