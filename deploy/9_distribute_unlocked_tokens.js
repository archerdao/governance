module.exports = async function ({ deployments }) {
    const { log } = deployments;
    const { distributeUnlockedTokens } = require("../scripts/distributeUnlockedTokens")
    log(`9) Distribute Unlocked Tokens`)
    await distributeUnlockedTokens()
    log(`- Distributed unlocked tokens`)
};

module.exports.skip = async function({ deployments }) {
    const { log, read } = deployments
    const { readGrantsFromFile } = require("../scripts/readGrantsFromFile")
    const grants = readGrantsFromFile()
    if (grants.length > 0) {
        const firstGranteeTokenBalance = await read("ArchToken", "balanceOf", grants[0].recipient)
        if (firstGranteeTokenBalance && firstGranteeTokenBalance > 0) {
            log(`9) Distribute Unlocked Tokens`)
            log(`- Skipping step, unlocked tokens already distributed`)
            return true
        } else {
            return false
        }
    } else {
        log(`9) Distribute Unlocked Tokens`)
        log(`- Skipping step, could not find grants`)
        return true
    }
}

module.exports.tags = ["9", "DistributeUnlockedTokens"];
module.exports.dependencies = ["8"]