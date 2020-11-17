module.exports = async ({ getNamedAccounts, deployments }) => {
  const { deploy, log } = deployments;
  const { deployer } = await getNamedAccounts()
  const token = await deployments.get("ArchToken")

  log(`9) Multisend`)
  // Deploy Multisend contract
  const deployResult = await deploy("Multisend", {
    from: deployer,
    contract: "Multisend",
    gas: 4000000,
    args: [token.address],
    skipIfAlreadyDeployed: true
  });

  if (deployResult.newlyDeployed) {
    log(`- ${deployResult.contractName} deployed at ${deployResult.address} using ${deployResult.receipt.gasUsed} gas`);
  } else {
    log(`- Deployment skipped, using previous deployment at: ${deployResult.address}`)
  }
};

module.exports.tags = ["9", "Multisend"]
module.exports.dependencies = ["8"]