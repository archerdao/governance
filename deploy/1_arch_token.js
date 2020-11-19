module.exports = async ({ getNamedAccounts, deployments }) => {
  const { deploy, log, deterministic } = deployments;
  const { deployer, admin } = await getNamedAccounts();

  // Unix timestamp = 2020/05/19 @ 12:00pm UTC
  const firstSupplyChangeAllowed = 1621425600

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