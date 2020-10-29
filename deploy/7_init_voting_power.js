module.exports = async function ({getNamedAccounts, deployments}) {
    const {deployIfDifferent, execute, log} = deployments;
    const namedAccounts = await getNamedAccounts();
    const {deployer, admin} = namedAccounts;
    const votingPower = await deployments.get("VotingPower");
    const votingPowerPrism = await deployments.get("VotingPowerPrism");
    const token = await deployments.get("ArchToken");
    const vesting = await deployments.get("Vesting");
    log(`7) Initialize Voting Power`)
    await execute('Vesting', {from: deployer}, 'setVotingPowerContract', votingPower.address);
    await execute('VotingPower', {from: deployer}, 'initialize', token.address, vesting.address);
    // log(`- Initialized voting power at ${votingPower.address} via prism at ${votingPowerPrism.address}`);
    // await execute('VotingPowerPrism', {from: deployer}, 'setPendingImplementation', votingPower.address);
    // log(`- Set pending voting power implementation for prism at ${votingPowerPrism.address} to contract at ${votingPower.address}`);
    // await execute('VotingPower', {from: deployer}, 'become', votingPowerPrism.address);
    // log(`- Accepted pending voting power implementation of contract at ${votingPower.address}`);
    // await execute('VotingPowerPrism', {from: deployer}, 'initialize', token.address, vesting.address);
    // log(`- Initialized voting power at ${votingPower.address} via prism at ${votingPowerPrism.address}`);
    // await execute('VotingPowerPrism', {from: deployer}, 'setPendingAdmin', votingPower.address);
    // log(`- Set pending voting power admin for prism at ${votingPowerPrism.address} to ${admin.address}`);
    // await execute('VotingPowerPrism', {from: admin}, 'acceptAdmin');
    // log(`- Accepted pending voting power admin for prism at ${votingPowerPrism.address} as ${admin.address}`);
};
module.exports.tags = ["7", "SetVotingPower"];
module.exports.dependencies = ["VotingPower", "VotingPowerPrism"]