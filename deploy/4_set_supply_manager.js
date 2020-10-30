module.exports = async function ({getNamedAccounts, deployments}) {
    const { execute, log} = deployments;
    const namedAccounts = await getNamedAccounts();
    const {deployer, admin} = namedAccounts;
    const supplyManager = await deployments.get("SupplyManager");

    log(`4) Set Supply Manager`)
    // Set SupplyManager for ArchToken to SupplyManager contract
    await execute('ArchToken', {from: deployer}, 'setSupplyManager', supplyManager.address);
    log(`- Set supply manager for ArchToken to contract at ${supplyManager.address}`);
};

module.exports.tags = ["4", "SetSupplyManager"];
module.exports.dependencies = ["ArchToken", "SupplyManager"]