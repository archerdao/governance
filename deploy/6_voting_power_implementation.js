module.exports = async ({ getNamedAccounts, deployments }) => {
  const { deploy, log } = deployments;
  const { deployer } = await getNamedAccounts();

  log(`6) Voting Power Implementation`)
  // Deploy VotingPower implementation contract
  const deployResult = await deploy("VotingPower", {
    from: deployer,
    contract: "VotingPower",
    gas: 4000000,
    skipIfAlreadyDeployed: false
  });

  if (deployResult.newlyDeployed) {
    log(`- ${deployResult.contractName} deployed at ${deployResult.address} using ${deployResult.receipt.gasUsed} gas`);
  } else {
    log(`- Deployment skipped, using previous deployment at: ${deployResult.address}`)
  }
};

module.exports.tags = ["6", "VotingPower"]
module.exports.dependencies = ["5"]