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
        const deployerSigner = await ethers.getSigner(deployer)
        const treasury = await ethers.provider.getSigner(DAO_TREASURY_ADDRESS)

        const ArchTokenDeployment = await deployments.get("ArchToken")
        const RewardsManager = await deployments.get("RewardsManager")
        const LockManager = await deployments.get("LockManager")
        const TokenRegistry = await deployments.get("TokenRegistry")
        const VotingPowerImpDeployment = await deployments.get("VotingPower")
        const ArchToken = new ethers.Contract(ArchTokenDeployment.address, ArchTokenDeployment.abi, deployerSigner)
        const VotingPowerImp = new ethers.Contract(VotingPowerImpDeployment.address, VotingPowerImpDeployment.abi, admin)
        const VotingPowerPrismDeployment = await deployments.get("VotingPowerPrism")
        const VotingPowerPrism = new ethers.Contract(VotingPowerPrismDeployment.address, VotingPowerPrismDeployment.abi, admin)
        const VotingPower = new ethers.Contract(VotingPowerPrismDeployment.address, VotingPowerImpDeployment.abi, admin)

        await deployerSigner.sendTransaction({ to: DAO_TREASURY_ADDRESS, value: ethers.utils.parseEther("0.05")})
        await ArchToken.connect(treasury).transfer(deployer, ethers.BigNumber.from(INITIAL_ARCH_REWARDS_BALANCE).mul(2));
        await ethers.provider.send('hardhat_stopImpersonatingAccount', [DAO_TREASURY_ADDRESS]);
        await deployerSigner.sendTransaction({ to: ADMIN_ADDRESS, value: ethers.utils.parseEther("0.05")})
        await VotingPowerPrism.setPendingProxyImplementation(VotingPowerImpDeployment.address);
        await VotingPowerImp.become(VotingPowerPrism.address);    
        await VotingPower.setLockManager(LockManager.address)
        await VotingPower.setTokenRegistry(TokenRegistry.address)
        await ArchToken.transfer(RewardsManager.address, ethers.BigNumber.from(INITIAL_ARCH_REWARDS_BALANCE))
    } else {
        log("Must configure manually using multi-sig")
    }
}

if (require.main === module) {
    configureRewardsManager()
}

module.exports.configureRewardsManager = configureRewardsManager
