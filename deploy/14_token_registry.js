module.exports = async function ({ ethers, getNamedAccounts, deployments }) {
    const { deploy, log } = deployments;
    const namedAccounts = await getNamedAccounts();
    const { deployer, admin } = namedAccounts;
    const ARCH_TOKEN_ADDRESS = process.env.ARCH_TOKEN_ADDRESS
    const SUSHI_LP_VP_CVR = process.env.SUSHI_LP_VP_CVR
    const SUSHI_POOL_ADDRESS = process.env.SUSHI_POOL_ADDRESS

    log(`14) TokenRegistry`)
    // Deploy ArchFormula contract
    let deployResult = await deploy("ArchFormula", {
        from: deployer,
        contract: "ArchFormula",
        gas: 4000000,
        skipIfAlreadyDeployed: true
    });

    if (deployResult.newlyDeployed) {
        log(`- ${deployResult.contractName} deployed at ${deployResult.address} using ${deployResult.receipt.gasUsed} gas`);
    } else {
        log(`- Deployment skipped, using previous deployment at: ${deployResult.address}`)
    }

    // Deploy SushiLPFormula contract
    deployResult = await deploy("SushiLPFormula", {
        from: deployer,
        contract: "SushiLPFormula",
        gas: 4000000,
        args: [admin, SUSHI_LP_VP_CVR],
        skipIfAlreadyDeployed: true
    });

    if (deployResult.newlyDeployed) {
        log(`- ${deployResult.contractName} deployed at ${deployResult.address} using ${deployResult.receipt.gasUsed} gas`);
    } else {
        log(`- Deployment skipped, using previous deployment at: ${deployResult.address}`)
    }

    const archFormula = await deployments.get("ArchFormula")
    const sushiFormula = await deployments.get("SushiLPFormula")

    // Deploy Token Registry contract
    deployResult = await deploy("TokenRegistry", {
        from: deployer,
        contract: "TokenRegistry",
        gas: 4000000,
        args: [admin, [ARCH_TOKEN_ADDRESS, SUSHI_POOL_ADDRESS], [archFormula.address, sushiFormula.address]],
        skipIfAlreadyDeployed: true
    });

    if (deployResult.newlyDeployed) {
        log(`- ${deployResult.contractName} deployed at ${deployResult.address} using ${deployResult.receipt.gasUsed} gas`);
    } else {
        log(`- Deployment skipped, using previous deployment at: ${deployResult.address}`)
    }
};

module.exports.tags = ["14", "TokenRegistry"];
module.exports.dependencies = ["13"]