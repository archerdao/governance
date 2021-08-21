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
module.exports.skip = async function({ deployments }) {
  const { validatePrism } = require("../scripts/validatePrism")
  const prismValid = await validatePrism()
  const { log } = deployments;
  if(prismValid) {
    return false
  } else {
    log(`6) Voting Power Implementation`)
    log(`- Skipping step, Prism has clashes with implementation contract`)
    return true
  }
}

module.exports.tags = ["6", "VotingPower"]
module.exports.dependencies = ["5"]