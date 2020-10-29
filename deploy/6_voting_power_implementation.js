module.exports = async ({
    getNamedAccounts,
    deployments,
  }) => {
  const { deploy, log } = deployments;
  const { deployer, admin } = await getNamedAccounts();

  const deployResult = await deploy("VotingPower", {
    from: deployer,
    contract: "VotingPower",
    gas: 4000000,
  });

  log(`6) Voting Power Implementation`)
  if (deployResult.newlyDeployed) {
    log(`- ${deployResult.contractName} deployed at ${deployResult.address} using ${deployResult.receipt.gasUsed} gas`);
  } else {
    log(`- ${deployResult.contractName} deployment skipped, using previous deployment at: ${deployResult.address}`)
  }
};
module.exports.tags = ["6", "VotingPower"]
module.exports.dependencies = ["VotingPowerPrism", "Vesting", "ArchToken"]