module.exports = async function ({ ethers, getNamedAccounts, deployments }) {
    const { deploy, log } = deployments;
    const namedAccounts = await getNamedAccounts();
    const { deployer, admin } = namedAccounts;
    const SUSHI_ADDRESS = process.env.SUSHI_ADDRESS
    const MASTERCHEF_ADDRESS = process.env.MASTERCHEF_ADDRESS
    const ARCH_REWARDS_PER_BLOCK = process.env.ARCH_REWARDS_PER_BLOCK
    const ARCH_REWARDS_START_BLOCK = process.env.ARCH_REWARDS_START_BLOCK
    const INITIAL_ARCH_REWARDS_BALANCE = process.env.INITIAL_ARCH_REWARDS_BALANCE
    const archToken = await deployments.get("ArchToken")
    const lockManager = await deployments.get("LockManager")
    const vault = await deployments.get("Vault")

    log(`15) RewardsManager`)
    // Deploy RewardsManager contract
    deployResult = await deploy("RewardsManager", {
        from: deployer,
        contract: "RewardsManager",
        gas: 4000000,
        args: [admin, lockManager.address, vault.address, archToken.address, SUSHI_ADDRESS, MASTERCHEF_ADDRESS, ARCH_REWARDS_START_BLOCK, ARCH_REWARDS_PER_BLOCK],
        skipIfAlreadyDeployed: true
    });

    if (deployResult.newlyDeployed) {
        log(`- ${deployResult.contractName} deployed at ${deployResult.address} using ${deployResult.receipt.gasUsed} gas`);
    } else {
        log(`- Deployment skipped, using previous deployment at: ${deployResult.address}`)
    }
};

module.exports.tags = ["15", "RewardsManager"];
module.exports.dependencies = ["14"]