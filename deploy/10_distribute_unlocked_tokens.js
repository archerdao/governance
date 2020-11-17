module.exports = async function ({ deployments, getNamedAccounts }) {
    const { execute, log } = deployments;
    const { deployer, liquidityProvider } = await getNamedAccounts()
    const TARGET_TOKEN_LIQUIDITY = process.env.TARGET_TOKEN_LIQUIDITY
    const { distributeUnlockedTokens } = require("../scripts/distributeUnlockedTokens")
    log(`10) Distribute Unlocked Tokens`)
    await distributeUnlockedTokens()
    log(`- Transferring ${TARGET_TOKEN_LIQUIDITY} tokens to liquidity provider address`)
    await execute('ArchToken', { from: deployer }, 'transfer', liquidityProvider, TARGET_TOKEN_LIQUIDITY);
};

module.exports.skip = async function({ deployments, getNamedAccounts }) {
    const { log, read } = deployments
    const { admin, liquidityProvider } = await getNamedAccounts()
    const { readGrantsFromFile } = require("../scripts/readGrantsFromFile")
    const grants = readGrantsFromFile()
    if (grants.length > 0) {
        const adminTokenBalance = await read("ArchToken", "balanceOf", admin)
        const liquidityProviderBalance = await read("ArchToken", "balanceOf", liquidityProvider)
        if (adminTokenBalance.gt(0) || liquidityProviderBalance.gt(0)) {
            log(`10) Distribute Unlocked Tokens`)
            log(`- Skipping step, unlocked tokens already distributed`)
            return true
        } else {
            return false
        }
    } else {
        log(`10) Distribute Unlocked Tokens`)
        log(`- Skipping step, could not find grants`)
        return true
    }
}

module.exports.tags = ["10", "DistributeUnlockedTokens"];
module.exports.dependencies = ["9"]