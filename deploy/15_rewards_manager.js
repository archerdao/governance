module.exports = async function ({ ethers, getNamedAccounts, deployments }) {
    const { deploy, log } = deployments;
    const namedAccounts = await getNamedAccounts();
    const { deployer, admin } = namedAccounts;
    const ARCH_TOKEN_ADDRESS = process.env.ARCH_TOKEN_ADDRESS
    const SUSHI_ADDRESS = process.env.SUSHI_ADDRESS
    const MASTERCHEF_ADDRESS = process.env.MASTERCHEF_ADDRESS
    const ARCH_REWARDS_PER_BLOCK = process.env.ARCH_REWARDS_PER_BLOCK
    let ARCH_REWARDS_START_BLOCK = process.env.ARCH_REWARDS_START_BLOCK
    if(ARCH_REWARDS_START_BLOCK == "0") {
        ARCH_REWARDS_START_BLOCK = await ethers.provider.getBlockNumber()
    }
    const BLOCKS_PER_MONTH = 200000
    const lockManager = await deployments.get("LockManager")
    const vault = await deployments.get("Vault")

    log(`15) RewardsManager`)
    // Deploy RewardsManager contract
    deployResult = await deploy("RewardsManager", {
        from: deployer,
        contract: "RewardsManager",
        gas: 4000000,
        args: [admin, lockManager.address, vault.address, ARCH_TOKEN_ADDRESS, SUSHI_ADDRESS, MASTERCHEF_ADDRESS, ARCH_REWARDS_PER_BLOCK, ARCH_REWARDS_START_BLOCK, ethers.BigNumber.from(ARCH_REWARDS_START_BLOCK).add(BLOCKS_PER_MONTH)],
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