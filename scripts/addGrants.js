const fs = require('fs')
const { ethers, deployments, getNamedAccounts, tenderly, network } = require("hardhat");

const tokenGrants = JSON.parse(fs.readFileSync(`./grants/${network.name}.json`, 'utf-8'))

const START_TIME = Date.now() + 21600
const VESTING_DURATION_IN_DAYS = 4
const VESTING_CLIFF_IN_DAYS = 1

async function addGrants(grants) {
    const { deployer, admin } = await getNamedAccounts();
    const token = await deployments.get('ArchToken')
    const vesting = await deployments.get('Vesting')
    const votingPower = await deployments.get('VotingPower')

    // await deployments.execute('Vesting', {from: deployer, gasLimit: 200000 }, 'changeOwner', admin);
    // await deployments.execute('Vesting', {from: admin, gasLimit: 400000 }, 'setVotingPowerContract', votingPower.address);
    // await deployments.execute('VotingPower', {from: admin, gasLimit: 400000 }, 'initialize', token.address, vesting.address);
    
    // await deployments.execute('ArchToken', { from: admin }, 'approve', vesting.address, ethers.constants.MaxUint256);

    let decimals = await deployments.read('ArchToken', 'decimals')
    for(const grant of grants) {
        console.log("Creating grant for " + grant.recipient + ": " + grant.amount)
        const grantAmount = ethers.BigNumber.from(grant.amount).mul(ethers.BigNumber.from(10).pow(decimals));
        await deployments.execute('Vesting', {from: admin, gasLimit: 6000000 }, 'addTokenGrant', grant.recipient, START_TIME, grantAmount, VESTING_DURATION_IN_DAYS, VESTING_CLIFF_IN_DAYS);
        const { newGrantStartTime, newGrantAmount, newGrantDuration, newGrantCliff } = await deployments.read('Vesting', 'getTokenGrant', grant.recipient)
        console.log(`New grant created for ${grant.recipient}:`)
        console.log(`- Start Time: ${newGrantStartTime}`)
        console.log(`- Amount: ${newGrantAmount}`)
        console.log(`- Duration: ${newGrantDuration}`)
        console.log(`- Cliff: ${newGrantCliff}`)
    }
}

addGrants(tokenGrants)