module.exports = async ({ getNamedAccounts, deployments }) => {
  const { deploy, log } = deployments;
  const { deployer, admin } = await getNamedAccounts();
  const currentTime = Date.now();
  const SIX_MONTHS_IN_SECS = 6 * 30 * 24 * 60 * 60;
  const firstSupplyChangeAllowed = currentTime + SIX_MONTHS_IN_SECS;

  log(`1) Arch Token`)
  // Deploy ArchToken contract
  const deployResult = await deploy("ArchToken", {
    from: deployer,
    contract: "ArchToken",
    gas: 4000000,
    args: [admin, deployer, firstSupplyChangeAllowed],
    skipIfAlreadyDeployed: true
  });

  if (deployResult.newlyDeployed) {
    log(`- ${deployResult.contractName} deployed at ${deployResult.address} using ${deployResult.receipt.gasUsed} gas`);
  } else {
    log(`- Deployment skipped, using previous deployment at: ${deployResult.address}`)
  }
};

module.exports.tags = ["1", "ArchToken"]