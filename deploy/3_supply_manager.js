module.exports = async ({ getNamedAccounts, deployments }) => {
  const { deploy, log } = deployments;
  const { deployer, admin } = await getNamedAccounts();
  const token = await deployments.get("ArchToken");

  log(`3) Supply Manager`)
  // Deploy SupplyManager contract
  const deployResult = await deploy("SupplyManager", {
    from: deployer,
    contract: "SupplyManager",
    gas: 4000000,
    args: [token.address, admin],
    skipIfAlreadyDeployed: true
  });

  if (deployResult.newlyDeployed) {
    log(`- ${deployResult.contractName} deployed at ${deployResult.address} using ${deployResult.receipt.gasUsed} gas`);
  } else {
    log(`- Deployment skipped, using previous deployment at: ${deployResult.address}`)
  }
};

module.exports.tags = ["3", "SupplyManager"]
module.exports.dependencies = ["2"]