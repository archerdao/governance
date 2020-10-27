module.exports = async ({
    getNamedAccounts,
    deployments,
  }) => {
    const { deploy } = deployments;
    const { deployer, admin } = await getNamedAccounts();
    const currentTime = Date.now();
    const SIX_MONTHS_IN_SECS = 6 * 30 * 24 * 60 * 60;
    const firstSupplyChangeAllowed = currentTime + SIX_MONTHS_IN_SECS;
  
    // the following will only deploy "ArchToken" if the contract was never deployed or if the code changed since last deployment
    await deploy("ArchToken", {
      from: deployer,
      gas: 4000000,
      args: [admin, admin, deployer, firstSupplyChangeAllowed]
    });
  };