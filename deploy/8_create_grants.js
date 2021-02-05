module.exports = async ({ deployments, getNamedAccounts }) => {
    const { log, execute } = deployments;
    const { deployer, admin } = await getNamedAccounts();
    const { addGrants } = require("../scripts/addGrants")

    log(`8) Create Grants`)
    // Set start time for grants at now + 48 hours
    // const delay = 48 * 60 * 60
    // const startTime = parseInt(Date.now() / 1000) + delay
    // Create grants from file
    await addGrants(0)
    log(`- Done creating grants`)
    // Change vesting owner
    log(`- Changing vesting contract owner to admin address: ${admin}`)
    await execute('Vesting', {from: deployer }, 'changeOwner', admin);
};

module.exports.skip = async function({ deployments }) {
    const { log } = deployments
    log(`8) Create Grants`)
    log(`- Skipping step, grants already created`)
    return true
}

module.exports.tags = ["8", "CreateGrants"]
module.exports.dependencies = ["7"]