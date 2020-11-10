const { readGrantsFromFile } = require('readGrantsFromFile')
const { ethers, deployments, getNamedAccounts } = require("hardhat");

const { log } = deployments;
let unlockedPercentage = .25

async function distributeUnlockedTokens() {
    const grants = readGrantsFromFile()
    const { deployer } = await getNamedAccounts();
    let decimals = await deployments.read('ArchToken', 'decimals')
    for(const grant of grants) {
        log(`- Sending unlocked tokens (if any) for ${grant.recipient}: ${grant.amount} - ${grant.class}`)
        if(grant.class == "vesting") {
            unlockedPercentage = .25
        } else if (grant.class == "unlocked") {
            unlockedPercentage = 1
        } else {
            log(`- No unlocked tokens for ${grant.recipient} - ${grant.class}`);
            continue
        }
        const unlockedAmount = ethers.BigNumber.from(grant.amount).mul(ethers.BigNumber.from(10).pow(decimals)).mul(ethers.BigNumber.from(unlockedPercentage));
        await deployments.execute('ArchToken', {from: deployer, gasLimit: 100000 }, 'transfer', grant.recipient, unlockedAmount);
        const newBalance = await deployments.read('ArchToken', 'balanceOf', grant.recipient)
        log(`Unlocked token balance for ${grant.recipient}: ${newBalance}`)
    }
}

distributeUnlockedTokens(tokenGrants)
module.exports.distributeUnlockedTokens = distributeUnlockedTokens