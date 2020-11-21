const { readGrantsFromFile } = require('./readGrantsFromFile')
const { ethers, deployments } = require("hardhat");

const { read } = deployments;
let decimals
let decimalMultiplier

async function fetchTokenBalances() {
    const grants = readGrantsFromFile()
    decimals = await deployments.read('ArchToken', 'decimals')
    decimalMultiplier = ethers.BigNumber.from(10).pow(decimals)
    let granteeBalances = []
    let unlockedPercentage = 25
    for(const grant of grants) {
        if(grant.class == "vesting") {
            unlockedPercentage = 25
        } else if (grant.class == "unlocked") {
            unlockedPercentage = 100
        } else {
            unlockedPercentage = 0
        }

        const totalTokenAllocation = ethers.BigNumber.from(parseInt(grant.amount * 100)).mul(decimalMultiplier).div(100)
        const unlockedAmount = totalTokenAllocation.mul(unlockedPercentage).div(100)
        const granteeBalance = await read('ArchToken', 'balanceOf', grant.recipient)
        const granteeGrant = await read('Vesting', 'getTokenGrant', grant.recipient)
        granteeBalances.push({
            'recipient': grant.recipient,
            'class': grant.class,
            'initialTotalBalance': totalTokenAllocation.toString(),
            'initialUnlockedBalance': unlockedAmount.toString(),
            'grantAmount': granteeGrant.amount.toString(),
            'claimedBalance': granteeGrant.totalClaimed.toString(),
            'currentBalance': granteeBalance.toString()
        })
    }
    return granteeBalances
}

async function printTokenBalances() {
    const granteeBalances = await fetchTokenBalances()
    for(const balance of granteeBalances){
        const initialTotalBalance = ethers.BigNumber.from(balance.initialTotalBalance).div(decimalMultiplier)
        const initialUnlockedBalance = ethers.BigNumber.from(balance.initialUnlockedBalance).div(decimalMultiplier)
        const grantAmount = ethers.BigNumber.from(balance.grantAmount).div(decimalMultiplier)
        const claimedBalance = ethers.BigNumber.from(balance.claimedBalance).div(decimalMultiplier)
        const currentBalance = ethers.BigNumber.from(balance.currentBalance).div(decimalMultiplier)
        console.log(`-----------------------------------------------------`)
        console.log(`Recipient: ${balance.recipient}`)
        console.log(`Class: ${balance.class}`)
        console.log(`Initial Total Balance: ${initialTotalBalance.toString()}`)
        console.log(`Initial Unlocked Balance: ${initialUnlockedBalance.toString()}`)
        console.log(`Grant Amount: ${grantAmount.toString()}`)
        console.log(`Claimed Balance: ${claimedBalance.toString()}`)
        console.log(`Current Balance: ${currentBalance.toString()}`)
    }
    console.log(`-----------------------------------------------------`)
}

if (require.main === module) {
    printTokenBalances()
}

module.exports.fetchTokenBalances = fetchTokenBalances
module.exports.printTokenBalances = printTokenBalances