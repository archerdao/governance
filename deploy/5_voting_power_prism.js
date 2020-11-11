module.exports = async ({ getNamedAccounts, deployments }) => {
  const { validatePrism } = require("../scripts/validatePrism")
  const { deploy, log } = deployments;
  const { deployer } = await getNamedAccounts();

  log(`5) Voting Power Prism`)
  // Check whether there are any issues with the voting power prism (selector clashes, etc.)
  const prismValid = await validatePrism()
  if(prismValid) {
    // Deploy VotingPowerPrism contract
    const deployResult = await deploy("VotingPowerPrism", {
      from: deployer,
      contract: "VotingPowerPrism",
      gas: 4000000,
      skipIfAlreadyDeployed: true
    });
    
    if (deployResult.newlyDeployed) {
      log(`- ${deployResult.contractName} deployed at ${deployResult.address} using ${deployResult.receipt.gasUsed} gas`);
    } else {
      log(`- Deployment skipped, using previous deployment at: ${deployResult.address}`)
    }
  } else {
    log(`- Prism invalid. Please address issues before trying to redeploy`)
    process.exit(1)
  }
};

module.exports.tags = ["5", "VotingPowerPrism"]
module.exports.dependencies = ["4"]