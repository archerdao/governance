const { readGrantsFromFile } = require('readGrantsFromFile')
const { ethers, deployments } = require("hardhat");

const { log } = deployments
let startTime = Date.now() + 21600
let vestingDurationInDays = 180
let vestingCliffInDays = 180
let vestingPercentage = .75

async function addGrants() {
    const grants = readGrantsFromFile()
    const owner = await deployments.read('Vesting', 'owner');
    let decimals = await deployments.read('ArchToken', 'decimals')
    for(const grant of grants) {
        log(`Creating grant for ${grant.recipient}: ${grant.amount} - ${grant.class}`)
        if(grant.class == "vesting") {
            vestingDurationInDays = 180
            vestingCliffInDays = 0
            vestingPercentage = .75
        } else if (grant.class == "team") {
            vestingDurationInDays = 540
            vestingCliffInDays = 180
            vestingPercentage = 1
        } else {
            log(`- No grant created for ${grant.recipient} - ${grant.class}`);
            continue
        }
        const grantAmount = ethers.BigNumber.from(grant.amount).mul(ethers.BigNumber.from(10).pow(decimals)).mul(ethers.BigNumber.from(vestingPercentage));
        await deployments.execute('Vesting', {from: owner, gasLimit: 6000000 }, 'addTokenGrant', grant.recipient, startTime, grantAmount, vestingDurationInDays, vestingCliffInDays);
        const newGrant = await deployments.read('Vesting', 'getTokenGrant', grant.recipient)
        log(`- New grant created for ${grant.recipient}:`)
        log(`- Start Time: ${newGrant[0]}`)
        log(`- Amount: ${newGrant[1]}`)
        log(`- Duration: ${newGrant[2]}`)
        log(`- Cliff: ${newGrant[3]}`)
    }
}

addGrants(tokenGrants)
module.exports.addGrants = addGrants