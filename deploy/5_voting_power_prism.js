module.exports = async ({
    getNamedAccounts,
    deployments,
  }) => {
  const { deploy, log } = deployments;
  const { deployer, admin } = await getNamedAccounts();

  // TODO: Validate prism before deployment
  log(`5) Voting Power Prism`)
  // Deploy VotingPowerPrism contract
  const deployResult = await deploy("VotingPowerPrism", {
    from: deployer,
    contract: "VotingPowerPrism",
    gas: 4000000,
  });
  
  if (deployResult.newlyDeployed) {
    log(`- ${deployResult.contractName} deployed at ${deployResult.address} using ${deployResult.receipt.gasUsed} gas`);
  } else {
    log(`- ${deployResult.contractName} deployment skipped, using previous deployment at: ${deployResult.address}`)
  }
};

module.exports.tags = ["5", "VotingPowerPrism"]
module.exports.dependencies = ["Vesting"]