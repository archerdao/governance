module.exports = async function ({ getNamedAccounts, deployments }) {
    const { execute, log } = deployments;
    const namedAccounts = await getNamedAccounts();
    const { deployer } = namedAccounts;
    const supplyManager = await deployments.get("SupplyManager");

    log(`4) Set Supply Manager`)
    // Set SupplyManager for ArchToken to SupplyManager contract
    await execute('ArchToken', {from: deployer}, 'setSupplyManager', supplyManager.address);
    log(`- Set supply manager for ArchToken to contract at ${supplyManager.address}`);
};

module.exports.skip = async function({ deployments }) {
    const { log, read } = deployments;
    const supplyManager = await deployments.get("SupplyManager");
    const tokenSupplyManager = await read('ArchToken', 'supplyManager');
    if(tokenSupplyManager == supplyManager.address) {
        log(`4) Set Supply Manager`)
        log(`- Skipping step, supply manager already set to contract at ${tokenSupplyManager}`)
        return true
    } else{
        return false
    }
}

module.exports.tags = ["4", "SetSupplyManager"];
module.exports.dependencies = ["3"]