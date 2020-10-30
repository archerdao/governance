module.exports = async function ({ ethers, getNamedAccounts, deployments}) {
    const { execute, read, log } = deployments;
    const accounts = await ethers.getSigners();
    const deployer = accounts[0];
    const admin = accounts[1];
    const votingPowerImplementation = await deployments.get("VotingPower");
    const votingPowerPrism = await deployments.get("VotingPowerPrism");
    const votingPower = new ethers.Contract(votingPowerPrism.address, votingPowerImplementation.abi, deployer)
    const token = await deployments.get("ArchToken");
    const vesting = await deployments.get("Vesting");
    log(`7) Initialize Voting Power`)
    // Set pending implementation for voting power prism
    await execute('VotingPowerPrism', {from: deployer.address }, 'setPendingImplementation', votingPowerImplementation.address);
    log(`- Set pending voting power implementation for prism at ${votingPowerPrism.address} to contract at ${votingPowerImplementation.address}`);

    // Accept voting power implementation
    await execute('VotingPower', {from: deployer.address }, 'become', votingPowerPrism.address);
    log(`- Accepted pending voting power implementation of contract at ${votingPowerImplementation.address}`);

    // Initialize voting power contract
    await votingPower.initialize(token.address, vesting.address);
    log(`- Initialized voting power at ${votingPowerImplementation.address} via prism at ${votingPowerPrism.address}`);
    log(`- ArchToken: ${await votingPower.archToken()}`);
    log(`- Vesting: ${await votingPower.vestingContract()}`);

    // Set pending admin for voting power
    await execute('VotingPowerPrism', {from: deployer.address }, 'setPendingAdmin', admin.address);
    log(`- Set pending voting power admin for prism at ${votingPowerPrism.address} to ${admin.address}`);

    // Accept admin for voting power
    await execute('VotingPowerPrism', {from: admin.address }, 'acceptAdmin');
    log(`- Accepted pending voting power admin for prism at ${votingPowerPrism.address} as ${admin.address}`);

    // Set voting power address in vesting contract
    await execute('Vesting', {from: deployer.address }, 'setVotingPowerContract', votingPowerPrism.address);
    log(`- Set voting power address in vesting contract at ${vesting.address} to prism at ${votingPowerPrism.address}`);
};

module.exports.tags = ["7", "SetVotingPower"];
module.exports.dependencies = ["VotingPower", "VotingPowerPrism"]