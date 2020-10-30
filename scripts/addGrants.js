const fs = require('fs')
const { ethers, deployments, network } = require("hardhat");

const tokenGrants = JSON.parse(fs.readFileSync(`./grants/${network.name}.json`, 'utf-8'))

const START_TIME = Date.now() + 21600
const VESTING_DURATION_IN_DAYS = 4
const VESTING_CLIFF_IN_DAYS = 1

async function addGrants(grants) {
    const owner = await deployments.read('Vesting', 'owner');
    let decimals = await deployments.read('ArchToken', 'decimals')
    for(const grant of grants) {
        console.log("Creating grant for " + grant.recipient + ": " + grant.amount)
        const grantAmount = ethers.BigNumber.from(grant.amount).mul(ethers.BigNumber.from(10).pow(decimals));
        await deployments.execute('Vesting', {from: owner, gasLimit: 6000000 }, 'addTokenGrant', grant.recipient, START_TIME, grantAmount, VESTING_DURATION_IN_DAYS, VESTING_CLIFF_IN_DAYS);
        const newGrant = await deployments.read('Vesting', 'getTokenGrant', grant.recipient)
        console.log(`New grant created for ${grant.recipient}:`)
        console.log(`- Start Time: ${newGrant[0]}`)
        console.log(`- Amount: ${newGrant[1]}`)
        console.log(`- Duration: ${newGrant[2]}`)
        console.log(`- Cliff: ${newGrant[3]}`)
    }
}

addGrants(tokenGrants)