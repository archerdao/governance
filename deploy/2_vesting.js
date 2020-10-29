module.exports = async ({
    getNamedAccounts,
    deployments,
  }) => {
  const { deploy, execute, log } = deployments;
  const { deployer, admin } = await getNamedAccounts();
  const token = await deployments.get("ArchToken");

  const deployResult = await deploy("Vesting", {
    from: deployer,
    contract: "Vesting",
    gas: 4000000,
    args: [token.address],
  });

  log(`2) Vesting`)
  if (deployResult.newlyDeployed) {
    log(`- ${deployResult.contractName} deployed at ${deployResult.address} using ${deployResult.receipt.gasUsed} gas`);
    await execute('ArchToken', { from: deployer }, 'approve', deployResult.address, ethers.constants.MaxUint256);
    log(`- Set max approval for vesting contract at ${deployResult.address} for deployer: ${deployer}`)
  } else {
    log(`- ${deployResult.contractName} deployment skipped, using previous deployment at: ${deployResult.address}`)
  }
};
module.exports.tags = ["2", "Vesting"]
module.exports.dependencies = ["ArchToken"]