const { expect } = require("chai");
const fs = require('fs')
const { ethers, network } = require("hardhat");
const { governanceFixture } = require("../fixtures")

describe("Vesting", function() {
    let archToken
    let vesting
    let votingPower
    let votingPowerPrism
    let votingPowerImplementation
    let deployer
    let admin
    let alice
    let bob
    let ZERO_ADDRESS

    beforeEach(async () => {
        const fix = await governanceFixture()
        archToken = fix.archToken
        vesting = fix.vesting
        votingPower = fix.votingPower
        votingPowerPrism = fix.votingPowerPrism
        votingPowerImplementation = fix.votingPowerImplementation
        deployer = fix.deployer
        admin = fix.admin
        alice = fix.alice
        bob = fix.bob
        ZERO_ADDRESS = fix.ZERO_ADDRESS
        await votingPowerPrism.setPendingProxyImplementation(votingPowerImplementation.address)
        await votingPowerImplementation.become(votingPowerPrism.address)
    })

  context("Pre-Init", async () => {
    context("setVotingPowerContract", async () => {
        it("reverts", async function() {
            await expect(vesting.setVotingPowerContract(votingPower.address)).to.revertedWith("Vest::setVotingPowerContract: voting power not initialized")
        })
    })
  })

  context("Post-Init", async () => {
    beforeEach(async () => {
        await votingPower.initialize(archToken.address, vesting.address)
    })

    context("addGrant", async () => {
      it("creates valid grant", async function() {
        await vesting.setVotingPowerContract(votingPower.address)
        await archToken.approve(vesting.address, ethers.constants.MaxUint256)
        let decimals = await archToken.decimals()
        const START_TIME = Date.now() + 21600
        const VESTING_DURATION_IN_DAYS = 4
        const VESTING_CLIFF_IN_DAYS = 1
        let totalVested = await archToken.balanceOf(vesting.address)
        let userVotesBefore = await votingPower.balanceOf(alice.address) 
        let grantAmount = ethers.BigNumber.from(1000).mul(ethers.BigNumber.from(10).pow(decimals))
        await vesting.addTokenGrant(alice.address, START_TIME, grantAmount, VESTING_DURATION_IN_DAYS, VESTING_CLIFF_IN_DAYS)
        const newGrant = await vesting.getTokenGrant(alice.address)
        expect(newGrant[0]).to.eq(START_TIME)
        expect(newGrant[1]).to.eq(grantAmount)
        expect(newGrant[2]).to.eq(VESTING_DURATION_IN_DAYS)
        expect(newGrant[3]).to.eq(VESTING_CLIFF_IN_DAYS)
        expect(newGrant[4]).to.eq(0)
        expect(await votingPower.balanceOf(alice.address)).to.eq(userVotesBefore.add(grantAmount))
        totalVested = totalVested.add(grantAmount)
        expect(await archToken.balanceOf(vesting.address)).to.eq(totalVested)
      })

      it("creates valid grants from file", async function() {
        await vesting.setVotingPowerContract(votingPower.address)
        await archToken.approve(vesting.address, ethers.constants.MaxUint256)
        const tokenGrants = JSON.parse(fs.readFileSync(`./grants/${network.name}.json`, 'utf-8'))
        let decimals = await archToken.decimals()
        const START_TIME = Date.now() + 21600
        const VESTING_DURATION_IN_DAYS = 4
        const VESTING_CLIFF_IN_DAYS = 1
        let totalVested = await archToken.balanceOf(vesting.address)

        for(const grant of tokenGrants) {
            let userVotesBefore = await votingPower.balanceOf(grant.recipient) 
            let grantAmount = ethers.BigNumber.from(grant.amount).mul(ethers.BigNumber.from(10).pow(decimals))
            await vesting.addTokenGrant(grant.recipient, START_TIME, grantAmount, VESTING_DURATION_IN_DAYS, VESTING_CLIFF_IN_DAYS)
            const newGrant = await vesting.getTokenGrant(grant.recipient)
            expect(newGrant[0]).to.eq(START_TIME)
            expect(newGrant[1]).to.eq(grantAmount)
            expect(newGrant[2]).to.eq(VESTING_DURATION_IN_DAYS)
            expect(newGrant[3]).to.eq(VESTING_CLIFF_IN_DAYS)
            expect(newGrant[4]).to.eq(0)
            expect(await votingPower.balanceOf(grant.recipient)).to.eq(userVotesBefore.add(grantAmount))
            totalVested = totalVested.add(grantAmount)
        }
        
        expect(await archToken.balanceOf(vesting.address)).to.eq(totalVested)
      })

      it("does not allow non-owner to create a grant", async function() {
        await archToken.connect(bob).approve(vesting.address, ethers.constants.MaxUint256)
        let decimals = await archToken.decimals()
        const START_TIME = Date.now() + 21600
        const VESTING_DURATION_IN_DAYS = 4
        const VESTING_CLIFF_IN_DAYS = 1
        let totalVested = await archToken.balanceOf(vesting.address)
        let userVotesBefore = await votingPower.balanceOf(alice.address) 
        let grantAmount = ethers.BigNumber.from(1000).mul(ethers.BigNumber.from(10).pow(decimals))
        await expect(vesting.connect(bob).addTokenGrant(alice.address, START_TIME, grantAmount, VESTING_DURATION_IN_DAYS, VESTING_CLIFF_IN_DAYS)).to.revertedWith("revert Vest::addTokenGrant: not owner")
        expect(await votingPower.balanceOf(alice.address)).to.eq(userVotesBefore)
        expect(await archToken.balanceOf(vesting.address)).to.eq(totalVested)
        const emptyGrant = await vesting.getTokenGrant(alice.address)
        expect(emptyGrant[0]).to.eq(0)
        expect(emptyGrant[1]).to.eq(0)
        expect(emptyGrant[2]).to.eq(0)
        expect(emptyGrant[3]).to.eq(0)
        expect(emptyGrant[4]).to.eq(0)
      })

      it("does not allow a grant before voting power contract is specified", async function() {
        await archToken.approve(vesting.address, ethers.constants.MaxUint256)
        let decimals = await archToken.decimals()
        const START_TIME = Date.now() + 21600
        const VESTING_DURATION_IN_DAYS = 4
        const VESTING_CLIFF_IN_DAYS = 1
        let totalVested = await archToken.balanceOf(vesting.address)
        let userVotesBefore = await votingPower.balanceOf(alice.address) 
        let grantAmount = ethers.BigNumber.from(1000).mul(ethers.BigNumber.from(10).pow(decimals))
        await expect(vesting.addTokenGrant(alice.address, START_TIME, grantAmount, VESTING_DURATION_IN_DAYS, VESTING_CLIFF_IN_DAYS)).to.revertedWith("revert Vest::addTokenGrant: Set Voting Power contract first")
        expect(await votingPower.balanceOf(alice.address)).to.eq(userVotesBefore)
        expect(await archToken.balanceOf(vesting.address)).to.eq(totalVested)
        const emptyGrant = await vesting.getTokenGrant(alice.address)
        expect(emptyGrant[0]).to.eq(0)
        expect(emptyGrant[1]).to.eq(0)
        expect(emptyGrant[2]).to.eq(0)
        expect(emptyGrant[3]).to.eq(0)
        expect(emptyGrant[4]).to.eq(0)
      })

      it("does not allow a grant with a cliff > 10 years", async function() {
        await vesting.setVotingPowerContract(votingPower.address)
        await archToken.approve(vesting.address, ethers.constants.MaxUint256)
        let decimals = await archToken.decimals()
        const START_TIME = Date.now() + 21600
        const VESTING_DURATION_IN_DAYS = 12 * 365
        const VESTING_CLIFF_IN_DAYS = 11 * 365
        let totalVested = await archToken.balanceOf(vesting.address)
        let userVotesBefore = await votingPower.balanceOf(alice.address) 
        let grantAmount = ethers.BigNumber.from(1000).mul(ethers.BigNumber.from(10).pow(decimals))
        await expect(vesting.addTokenGrant(alice.address, START_TIME, grantAmount, VESTING_DURATION_IN_DAYS, VESTING_CLIFF_IN_DAYS)).to.revertedWith("revert Vest::addTokenGrant: cliff more than 10 years")
        expect(await votingPower.balanceOf(alice.address)).to.eq(userVotesBefore)
        expect(await archToken.balanceOf(vesting.address)).to.eq(totalVested)
        const emptyGrant = await vesting.getTokenGrant(alice.address)
        expect(emptyGrant[0]).to.eq(0)
        expect(emptyGrant[1]).to.eq(0)
        expect(emptyGrant[2]).to.eq(0)
        expect(emptyGrant[3]).to.eq(0)
        expect(emptyGrant[4]).to.eq(0)
      })

      it("does not allow a grant with a duration of 0", async function() {
        await vesting.setVotingPowerContract(votingPower.address)
        await archToken.approve(vesting.address, ethers.constants.MaxUint256)
        let decimals = await archToken.decimals()
        const START_TIME = Date.now() + 21600
        const VESTING_DURATION_IN_DAYS = 0
        const VESTING_CLIFF_IN_DAYS = 0
        let totalVested = await archToken.balanceOf(vesting.address)
        let userVotesBefore = await votingPower.balanceOf(alice.address) 
        let grantAmount = ethers.BigNumber.from(1000).mul(ethers.BigNumber.from(10).pow(decimals))
        await expect(vesting.addTokenGrant(alice.address, START_TIME, grantAmount, VESTING_DURATION_IN_DAYS, VESTING_CLIFF_IN_DAYS)).to.revertedWith("revert Vest::addTokenGrant: duration must be > 0")
        expect(await votingPower.balanceOf(alice.address)).to.eq(userVotesBefore)
        expect(await archToken.balanceOf(vesting.address)).to.eq(totalVested)
        const emptyGrant = await vesting.getTokenGrant(alice.address)
        expect(emptyGrant[0]).to.eq(0)
        expect(emptyGrant[1]).to.eq(0)
        expect(emptyGrant[2]).to.eq(0)
        expect(emptyGrant[3]).to.eq(0)
        expect(emptyGrant[4]).to.eq(0)
      })

      it("does not allow a grant with a duration of > 25 years", async function() {
        await vesting.setVotingPowerContract(votingPower.address)
        await archToken.approve(vesting.address, ethers.constants.MaxUint256)
        let decimals = await archToken.decimals()
        const START_TIME = Date.now() + 21600
        const VESTING_DURATION_IN_DAYS = 26 * 365
        const VESTING_CLIFF_IN_DAYS = 1
        let totalVested = await archToken.balanceOf(vesting.address)
        let userVotesBefore = await votingPower.balanceOf(alice.address) 
        let grantAmount = ethers.BigNumber.from(1000).mul(ethers.BigNumber.from(10).pow(decimals))
        await expect(vesting.addTokenGrant(alice.address, START_TIME, grantAmount, VESTING_DURATION_IN_DAYS, VESTING_CLIFF_IN_DAYS)).to.revertedWith("revert Vest::addTokenGrant: duration more than 25 years")
        expect(await votingPower.balanceOf(alice.address)).to.eq(userVotesBefore)
        expect(await archToken.balanceOf(vesting.address)).to.eq(totalVested)
        const emptyGrant = await vesting.getTokenGrant(alice.address)
        expect(emptyGrant[0]).to.eq(0)
        expect(emptyGrant[1]).to.eq(0)
        expect(emptyGrant[2]).to.eq(0)
        expect(emptyGrant[3]).to.eq(0)
        expect(emptyGrant[4]).to.eq(0)
      })

      it("does not allow a grant with a duration < cliff", async function() {
        await vesting.setVotingPowerContract(votingPower.address)
        await archToken.approve(vesting.address, ethers.constants.MaxUint256)
        let decimals = await archToken.decimals()
        const START_TIME = Date.now() + 21600
        const VESTING_DURATION_IN_DAYS = 4
        const VESTING_CLIFF_IN_DAYS = 5
        let totalVested = await archToken.balanceOf(vesting.address)
        let userVotesBefore = await votingPower.balanceOf(alice.address) 
        let grantAmount = ethers.BigNumber.from(1000).mul(ethers.BigNumber.from(10).pow(decimals))
        await expect(vesting.addTokenGrant(alice.address, START_TIME, grantAmount, VESTING_DURATION_IN_DAYS, VESTING_CLIFF_IN_DAYS)).to.revertedWith("revert Vest::addTokenGrant: duration < cliff")
        expect(await votingPower.balanceOf(alice.address)).to.eq(userVotesBefore)
        expect(await archToken.balanceOf(vesting.address)).to.eq(totalVested)
        const emptyGrant = await vesting.getTokenGrant(alice.address)
        expect(emptyGrant[0]).to.eq(0)
        expect(emptyGrant[1]).to.eq(0)
        expect(emptyGrant[2]).to.eq(0)
        expect(emptyGrant[3]).to.eq(0)
        expect(emptyGrant[4]).to.eq(0)
      })

      it("does not allow a grant for an account with an existing grant", async function() {
        await vesting.setVotingPowerContract(votingPower.address)
        await archToken.approve(vesting.address, ethers.constants.MaxUint256)
        let decimals = await archToken.decimals()
        const START_TIME = Date.now() + 21600
        const VESTING_DURATION_IN_DAYS = 4
        const VESTING_CLIFF_IN_DAYS = 1
        let totalVested = await archToken.balanceOf(vesting.address)
        let userVotesBefore = await votingPower.balanceOf(alice.address) 
        let grantAmount = ethers.BigNumber.from(1000).mul(ethers.BigNumber.from(10).pow(decimals))
        await vesting.addTokenGrant(alice.address, START_TIME, grantAmount, VESTING_DURATION_IN_DAYS, VESTING_CLIFF_IN_DAYS)
        const newGrant = await vesting.getTokenGrant(alice.address)
        expect(newGrant[0]).to.eq(START_TIME)
        expect(newGrant[1]).to.eq(grantAmount)
        expect(newGrant[2]).to.eq(VESTING_DURATION_IN_DAYS)
        expect(newGrant[3]).to.eq(VESTING_CLIFF_IN_DAYS)
        expect(newGrant[4]).to.eq(0)
        let userVotesAfter = userVotesBefore.add(grantAmount)
        expect(await votingPower.balanceOf(alice.address)).to.eq(userVotesAfter)
        totalVested = totalVested.add(grantAmount)
        expect(await archToken.balanceOf(vesting.address)).to.eq(totalVested)
        await expect(vesting.addTokenGrant(alice.address, START_TIME, grantAmount, VESTING_DURATION_IN_DAYS, VESTING_CLIFF_IN_DAYS)).to.revertedWith("revert Vest::addTokenGrant: grant already exists for account")
        expect(await votingPower.balanceOf(alice.address)).to.eq(userVotesAfter)
        expect(await archToken.balanceOf(vesting.address)).to.eq(totalVested)
        const existingGrant = await vesting.getTokenGrant(alice.address)
        expect(existingGrant[0]).to.eq(START_TIME)
        expect(existingGrant[1]).to.eq(grantAmount)
        expect(existingGrant[2]).to.eq(VESTING_DURATION_IN_DAYS)
        expect(existingGrant[3]).to.eq(VESTING_CLIFF_IN_DAYS)
        expect(existingGrant[4]).to.eq(0)
      })

      it("does not allow a grant of 0", async function() {
        await vesting.setVotingPowerContract(votingPower.address)
        await archToken.approve(vesting.address, ethers.constants.MaxUint256)
        let decimals = await archToken.decimals()
        const START_TIME = Date.now() + 21600
        const VESTING_DURATION_IN_DAYS = 4
        const VESTING_CLIFF_IN_DAYS = 1
        let totalVested = await archToken.balanceOf(vesting.address)
        let userVotesBefore = await votingPower.balanceOf(alice.address) 
        let grantAmount = ethers.BigNumber.from(0).mul(ethers.BigNumber.from(10).pow(decimals))
        await expect(vesting.addTokenGrant(alice.address, START_TIME, grantAmount, VESTING_DURATION_IN_DAYS, VESTING_CLIFF_IN_DAYS)).to.revertedWith("revert Vest::addTokenGrant: amountVestedPerDay > 0")
        expect(await votingPower.balanceOf(alice.address)).to.eq(userVotesBefore)
        expect(await archToken.balanceOf(vesting.address)).to.eq(totalVested)
        const emptyGrant = await vesting.getTokenGrant(alice.address)
        expect(emptyGrant[0]).to.eq(0)
        expect(emptyGrant[1]).to.eq(0)
        expect(emptyGrant[2]).to.eq(0)
        expect(emptyGrant[3]).to.eq(0)
        expect(emptyGrant[4]).to.eq(0)
      })

      it("does not allow a grant where tokens vested per day < 1", async function() {
        await vesting.setVotingPowerContract(votingPower.address)
        await archToken.approve(vesting.address, ethers.constants.MaxUint256)
        let decimals = await archToken.decimals()
        const START_TIME = Date.now() + 21600
        const VESTING_DURATION_IN_DAYS = 4
        const VESTING_CLIFF_IN_DAYS = 1
        let totalVested = await archToken.balanceOf(vesting.address)
        let userVotesBefore = await votingPower.balanceOf(alice.address) 
        let grantAmount = ethers.BigNumber.from(3)
        await expect(vesting.addTokenGrant(alice.address, START_TIME, grantAmount, VESTING_DURATION_IN_DAYS, VESTING_CLIFF_IN_DAYS)).to.revertedWith("revert Vest::addTokenGrant: amountVestedPerDay > 0")
        expect(await votingPower.balanceOf(alice.address)).to.eq(userVotesBefore)
        expect(await archToken.balanceOf(vesting.address)).to.eq(totalVested)
        const emptyGrant = await vesting.getTokenGrant(alice.address)
        expect(emptyGrant[0]).to.eq(0)
        expect(emptyGrant[1]).to.eq(0)
        expect(emptyGrant[2]).to.eq(0)
        expect(emptyGrant[3]).to.eq(0)
        expect(emptyGrant[4]).to.eq(0)
      })

      it("does not allow a grant when owner has insufficient balance", async function() {
        await vesting.setVotingPowerContract(votingPower.address)
        await archToken.approve(vesting.address, ethers.constants.MaxUint256)
        await archToken.transfer(bob.address, await archToken.balanceOf(deployer.address))
        let decimals = await archToken.decimals()
        const START_TIME = Date.now() + 21600
        const VESTING_DURATION_IN_DAYS = 4
        const VESTING_CLIFF_IN_DAYS = 1
        let totalVested = await archToken.balanceOf(vesting.address)
        let userVotesBefore = await votingPower.balanceOf(alice.address) 
        let grantAmount = ethers.BigNumber.from(1000).mul(ethers.BigNumber.from(10).pow(decimals))
        await expect(vesting.addTokenGrant(alice.address, START_TIME, grantAmount, VESTING_DURATION_IN_DAYS, VESTING_CLIFF_IN_DAYS)).to.revertedWith("revert Arch::_transferTokens: transfer exceeds from balance")
        expect(await votingPower.balanceOf(alice.address)).to.eq(userVotesBefore)
        expect(await archToken.balanceOf(vesting.address)).to.eq(totalVested)
        const emptyGrant = await vesting.getTokenGrant(alice.address)
        expect(emptyGrant[0]).to.eq(0)
        expect(emptyGrant[1]).to.eq(0)
        expect(emptyGrant[2]).to.eq(0)
        expect(emptyGrant[3]).to.eq(0)
        expect(emptyGrant[4]).to.eq(0)
      })
    })

    context("tokensVestedPerDay", async () => {
      it("returns correct tokens vested per day", async function() {
        await vesting.setVotingPowerContract(votingPower.address)
        await archToken.approve(vesting.address, ethers.constants.MaxUint256)
        let decimals = await archToken.decimals()
        const START_TIME = Date.now() + 21600
        const VESTING_DURATION_IN_DAYS = 4
        const VESTING_CLIFF_IN_DAYS = 1
        let grantAmount = ethers.BigNumber.from(1000).mul(ethers.BigNumber.from(10).pow(decimals))
        await vesting.addTokenGrant(alice.address, START_TIME, grantAmount, VESTING_DURATION_IN_DAYS, VESTING_CLIFF_IN_DAYS)
        expect(await vesting.tokensVestedPerDay(alice.address)).to.eq(grantAmount.div(VESTING_DURATION_IN_DAYS))
      })
    })

    context("calculateGrantClaim", async () => {
      it("returns 0 before grant start time", async function() {
        await vesting.setVotingPowerContract(votingPower.address)
        await archToken.approve(vesting.address, ethers.constants.MaxUint256)
        let decimals = await archToken.decimals()
        const { timestamp } = await ethers.provider.getBlock('latest')
        const START_TIME = timestamp + 21600
        const VESTING_DURATION_IN_DAYS = 4
        const VESTING_CLIFF_IN_DAYS = 1
        let grantAmount = ethers.BigNumber.from(1000).mul(ethers.BigNumber.from(10).pow(decimals))
        await vesting.addTokenGrant(alice.address, START_TIME, grantAmount, VESTING_DURATION_IN_DAYS, VESTING_CLIFF_IN_DAYS)
        expect(await vesting.calculateGrantClaim(alice.address)).to.eq(0)
      })

      it("returns 0 before grant cliff", async function() {
        await vesting.setVotingPowerContract(votingPower.address)
        await archToken.approve(vesting.address, ethers.constants.MaxUint256)
        let decimals = await archToken.decimals()
        const { timestamp } = await ethers.provider.getBlock('latest')
        const START_TIME = timestamp + 21600
        const VESTING_DURATION_IN_DAYS = 4
        const VESTING_CLIFF_IN_DAYS = 1
        let grantAmount = ethers.BigNumber.from(1000).mul(ethers.BigNumber.from(10).pow(decimals))
        await vesting.addTokenGrant(alice.address, START_TIME, grantAmount, VESTING_DURATION_IN_DAYS, VESTING_CLIFF_IN_DAYS)
        await ethers.provider.send("evm_setNextBlockTimestamp", [timestamp + 21600])
        await ethers.provider.send("evm_mine")
        expect(await vesting.calculateGrantClaim(alice.address)).to.eq(0)
      })

      it("returns total grant if after duration and none claimed", async function() {
        await vesting.setVotingPowerContract(votingPower.address)
        await archToken.approve(vesting.address, ethers.constants.MaxUint256)
        let decimals = await archToken.decimals()
        const { timestamp } = await ethers.provider.getBlock('latest')
        const START_TIME = timestamp + 21600
        const VESTING_DURATION_IN_DAYS = 4
        const VESTING_DURATION_IN_SECS = VESTING_DURATION_IN_DAYS * 24 * 60 * 60
        const VESTING_CLIFF_IN_DAYS = 1
        let grantAmount = ethers.BigNumber.from(1000).mul(ethers.BigNumber.from(10).pow(decimals))
        await vesting.addTokenGrant(alice.address, START_TIME, grantAmount, VESTING_DURATION_IN_DAYS, VESTING_CLIFF_IN_DAYS)
        await ethers.provider.send("evm_setNextBlockTimestamp", [timestamp + 21600 + VESTING_DURATION_IN_SECS])
        await ethers.provider.send("evm_mine")
        expect(await vesting.calculateGrantClaim(alice.address)).to.eq(grantAmount)
      })

      it("returns remaining grant if after duration and some claimed", async function() {
        await vesting.setVotingPowerContract(votingPower.address)
        await archToken.approve(vesting.address, ethers.constants.MaxUint256)
        let decimals = await archToken.decimals()
        const { timestamp } = await ethers.provider.getBlock('latest')
        const START_TIME = timestamp + 21600
        const VESTING_DURATION_IN_DAYS = 4
        const VESTING_DURATION_IN_SECS = VESTING_DURATION_IN_DAYS * 24 * 60 * 60
        const VESTING_CLIFF_IN_DAYS = 1
        const VESTING_CLIFF_IN_SECS = VESTING_CLIFF_IN_DAYS * 24 * 60 * 60
        let grantAmount = ethers.BigNumber.from(1000).mul(ethers.BigNumber.from(10).pow(decimals))
        await vesting.addTokenGrant(alice.address, START_TIME, grantAmount, VESTING_DURATION_IN_DAYS, VESTING_CLIFF_IN_DAYS)
        await ethers.provider.send("evm_setNextBlockTimestamp", [timestamp + 21600 + VESTING_CLIFF_IN_SECS * 2])
        await vesting.claimVestedTokens(alice.address)
        let amountClaimed = await vesting.claimedBalance(alice.address)
        await ethers.provider.send("evm_setNextBlockTimestamp", [timestamp + 21600 + VESTING_DURATION_IN_SECS])
        await ethers.provider.send("evm_mine")
        expect(await vesting.calculateGrantClaim(alice.address)).to.eq(grantAmount.sub(amountClaimed))
      })


      it("returns claimable balance if after cliff and none claimed", async function() {
        await vesting.setVotingPowerContract(votingPower.address)
        await archToken.approve(vesting.address, ethers.constants.MaxUint256)
        let decimals = await archToken.decimals()
        const { timestamp } = await ethers.provider.getBlock('latest')
        const START_TIME = timestamp + 21600
        const VESTING_DURATION_IN_DAYS = 4
        const VESTING_DURATION_IN_SECS = VESTING_DURATION_IN_DAYS * 24 * 60 * 60
        const VESTING_CLIFF_IN_DAYS = 1
        const VESTING_CLIFF_IN_SECS = VESTING_CLIFF_IN_DAYS * 24 * 60 * 60
        let grantAmount = ethers.BigNumber.from(1000).mul(ethers.BigNumber.from(10).pow(decimals))
        await vesting.addTokenGrant(alice.address, START_TIME, grantAmount, VESTING_DURATION_IN_DAYS, VESTING_CLIFF_IN_DAYS)
        let newTime = timestamp + 21600 + VESTING_CLIFF_IN_SECS + 60
        await ethers.provider.send("evm_setNextBlockTimestamp", [newTime])
        await ethers.provider.send("evm_mine")
        let elapsedTime = newTime - START_TIME
        expect(await vesting.calculateGrantClaim(alice.address)).to.eq(grantAmount.div(VESTING_DURATION_IN_SECS).mul(elapsedTime))
      })

      it("returns claimable balance if after cliff and some claimed", async function() {
        await vesting.setVotingPowerContract(votingPower.address)
        await archToken.approve(vesting.address, ethers.constants.MaxUint256)
        let decimals = await archToken.decimals()
        const { timestamp } = await ethers.provider.getBlock('latest')
        const START_TIME = timestamp + 21600
        const VESTING_DURATION_IN_DAYS = 4
        const VESTING_DURATION_IN_SECS = VESTING_DURATION_IN_DAYS * 24 * 60 * 60
        const VESTING_CLIFF_IN_DAYS = 1
        const VESTING_CLIFF_IN_SECS = VESTING_CLIFF_IN_DAYS * 24 * 60 * 60
        let grantAmount = ethers.BigNumber.from(1000).mul(ethers.BigNumber.from(10).pow(decimals))
        await vesting.addTokenGrant(alice.address, START_TIME, grantAmount, VESTING_DURATION_IN_DAYS, VESTING_CLIFF_IN_DAYS)
        let newTime = timestamp + 21600 + VESTING_CLIFF_IN_SECS + 60
        await ethers.provider.send("evm_setNextBlockTimestamp", [newTime])
        await ethers.provider.send("evm_mine")        
        await vesting.claimVestedTokens(alice.address)
        let amountClaimed = await vesting.claimedBalance(alice.address)
        newTime = timestamp + 21600 + VESTING_CLIFF_IN_SECS + 60 + 60
        await ethers.provider.send("evm_setNextBlockTimestamp", [newTime])
        await ethers.provider.send("evm_mine")
        let elapsedTime = newTime - START_TIME
        expect(await vesting.calculateGrantClaim(alice.address)).to.eq(grantAmount.div(VESTING_DURATION_IN_SECS).mul(elapsedTime).sub(amountClaimed))
      })
    })

    context("vestedBalance", async () => {
      it("returns 0 before grant start time", async function() {
        await vesting.setVotingPowerContract(votingPower.address)
        await archToken.approve(vesting.address, ethers.constants.MaxUint256)
        let decimals = await archToken.decimals()
        const { timestamp } = await ethers.provider.getBlock('latest')
        const START_TIME = timestamp + 21600
        const VESTING_DURATION_IN_DAYS = 4
        const VESTING_CLIFF_IN_DAYS = 1
        let grantAmount = ethers.BigNumber.from(1000).mul(ethers.BigNumber.from(10).pow(decimals))
        await vesting.addTokenGrant(alice.address, START_TIME, grantAmount, VESTING_DURATION_IN_DAYS, VESTING_CLIFF_IN_DAYS)
        expect(await vesting.vestedBalance(alice.address)).to.eq(0)
      })

      it("returns 0 before grant cliff", async function() {
        await vesting.setVotingPowerContract(votingPower.address)
        await archToken.approve(vesting.address, ethers.constants.MaxUint256)
        let decimals = await archToken.decimals()
        const { timestamp } = await ethers.provider.getBlock('latest')
        const START_TIME = timestamp + 21600
        const VESTING_DURATION_IN_DAYS = 4
        const VESTING_CLIFF_IN_DAYS = 1
        let grantAmount = ethers.BigNumber.from(1000).mul(ethers.BigNumber.from(10).pow(decimals))
        await vesting.addTokenGrant(alice.address, START_TIME, grantAmount, VESTING_DURATION_IN_DAYS, VESTING_CLIFF_IN_DAYS)
        await ethers.provider.send("evm_setNextBlockTimestamp", [timestamp + 21600])
        await ethers.provider.send("evm_mine")
        expect(await vesting.vestedBalance(alice.address)).to.eq(0)
      })

      it("returns total grant if after duration and none claimed", async function() {
        await vesting.setVotingPowerContract(votingPower.address)
        await archToken.approve(vesting.address, ethers.constants.MaxUint256)
        let decimals = await archToken.decimals()
        const { timestamp } = await ethers.provider.getBlock('latest')
        const START_TIME = timestamp + 21600
        const VESTING_DURATION_IN_DAYS = 4
        const VESTING_DURATION_IN_SECS = VESTING_DURATION_IN_DAYS * 24 * 60 * 60
        const VESTING_CLIFF_IN_DAYS = 1
        let grantAmount = ethers.BigNumber.from(1000).mul(ethers.BigNumber.from(10).pow(decimals))
        await vesting.addTokenGrant(alice.address, START_TIME, grantAmount, VESTING_DURATION_IN_DAYS, VESTING_CLIFF_IN_DAYS)
        await ethers.provider.send("evm_setNextBlockTimestamp", [timestamp + 21600 + VESTING_DURATION_IN_SECS])
        await ethers.provider.send("evm_mine")
        expect(await vesting.vestedBalance(alice.address)).to.eq(grantAmount)
      })

      it("returns total grant if after duration and some claimed", async function() {
        await vesting.setVotingPowerContract(votingPower.address)
        await archToken.approve(vesting.address, ethers.constants.MaxUint256)
        let decimals = await archToken.decimals()
        const { timestamp } = await ethers.provider.getBlock('latest')
        const START_TIME = timestamp + 21600
        const VESTING_DURATION_IN_DAYS = 4
        const VESTING_DURATION_IN_SECS = VESTING_DURATION_IN_DAYS * 24 * 60 * 60
        const VESTING_CLIFF_IN_DAYS = 1
        const VESTING_CLIFF_IN_SECS = VESTING_CLIFF_IN_DAYS * 24 * 60 * 60
        let grantAmount = ethers.BigNumber.from(1000).mul(ethers.BigNumber.from(10).pow(decimals))
        await vesting.addTokenGrant(alice.address, START_TIME, grantAmount, VESTING_DURATION_IN_DAYS, VESTING_CLIFF_IN_DAYS)
        await ethers.provider.send("evm_setNextBlockTimestamp", [timestamp + 21600 + VESTING_CLIFF_IN_SECS * 2])
        await vesting.claimVestedTokens(alice.address)
        await ethers.provider.send("evm_setNextBlockTimestamp", [timestamp + 21600 + VESTING_DURATION_IN_SECS])
        await ethers.provider.send("evm_mine")
        expect(await vesting.vestedBalance(alice.address)).to.eq(grantAmount)
      })


      it("returns vested balance if after cliff and none claimed", async function() {
        await vesting.setVotingPowerContract(votingPower.address)
        await archToken.approve(vesting.address, ethers.constants.MaxUint256)
        let decimals = await archToken.decimals()
        const { timestamp } = await ethers.provider.getBlock('latest')
        const START_TIME = timestamp + 21600
        const VESTING_DURATION_IN_DAYS = 4
        const VESTING_DURATION_IN_SECS = VESTING_DURATION_IN_DAYS * 24 * 60 * 60
        const VESTING_CLIFF_IN_DAYS = 1
        const VESTING_CLIFF_IN_SECS = VESTING_CLIFF_IN_DAYS * 24 * 60 * 60
        let grantAmount = ethers.BigNumber.from(1000).mul(ethers.BigNumber.from(10).pow(decimals))
        await vesting.addTokenGrant(alice.address, START_TIME, grantAmount, VESTING_DURATION_IN_DAYS, VESTING_CLIFF_IN_DAYS)
        let newTime = timestamp + 21600 + VESTING_CLIFF_IN_SECS + 60
        await ethers.provider.send("evm_setNextBlockTimestamp", [newTime])
        await ethers.provider.send("evm_mine")
        let elapsedTime = newTime - START_TIME
        expect(await vesting.vestedBalance(alice.address)).to.eq(grantAmount.div(VESTING_DURATION_IN_SECS).mul(elapsedTime))
      })

      it("returns vested balance if after cliff and some claimed", async function() {
        await vesting.setVotingPowerContract(votingPower.address)
        await archToken.approve(vesting.address, ethers.constants.MaxUint256)
        let decimals = await archToken.decimals()
        const { timestamp } = await ethers.provider.getBlock('latest')
        const START_TIME = timestamp + 21600
        const VESTING_DURATION_IN_DAYS = 4
        const VESTING_DURATION_IN_SECS = VESTING_DURATION_IN_DAYS * 24 * 60 * 60
        const VESTING_CLIFF_IN_DAYS = 1
        const VESTING_CLIFF_IN_SECS = VESTING_CLIFF_IN_DAYS * 24 * 60 * 60
        let grantAmount = ethers.BigNumber.from(1000).mul(ethers.BigNumber.from(10).pow(decimals))
        await vesting.addTokenGrant(alice.address, START_TIME, grantAmount, VESTING_DURATION_IN_DAYS, VESTING_CLIFF_IN_DAYS)
        let newTime = timestamp + 21600 + VESTING_CLIFF_IN_SECS + 60
        await ethers.provider.send("evm_setNextBlockTimestamp", [newTime])
        await ethers.provider.send("evm_mine")        
        await vesting.claimVestedTokens(alice.address)
        newTime = timestamp + 21600 + VESTING_CLIFF_IN_SECS + 60 + 60
        await ethers.provider.send("evm_setNextBlockTimestamp", [newTime])
        await ethers.provider.send("evm_mine")
        let elapsedTime = newTime - START_TIME
        expect(await vesting.vestedBalance(alice.address)).to.eq(grantAmount.div(VESTING_DURATION_IN_SECS).mul(elapsedTime))
      })
    })

    context("claimVestedTokens", async () => {
      it("does not allow user to claim if no tokens have vested", async function() {
        await vesting.setVotingPowerContract(votingPower.address)
        await archToken.approve(vesting.address, ethers.constants.MaxUint256)
        let decimals = await archToken.decimals()
        const { timestamp } = await ethers.provider.getBlock('latest')
        const START_TIME = timestamp + 21600
        const VESTING_DURATION_IN_DAYS = 4
        const VESTING_CLIFF_IN_DAYS = 1
        let grantAmount = ethers.BigNumber.from(1000).mul(ethers.BigNumber.from(10).pow(decimals))
        await vesting.addTokenGrant(alice.address, START_TIME, grantAmount, VESTING_DURATION_IN_DAYS, VESTING_CLIFF_IN_DAYS)
        await expect(vesting.claimVestedTokens(alice.address)).to.revertedWith("revert Vest::claimVested: amountVested is 0")
      })

      it("allows user to claim vested tokens once", async function() {
        await vesting.setVotingPowerContract(votingPower.address)
        await archToken.approve(vesting.address, ethers.constants.MaxUint256)
        let decimals = await archToken.decimals()
        const { timestamp } = await ethers.provider.getBlock('latest')
        const START_TIME = timestamp + 21600
        const VESTING_DURATION_IN_DAYS = 4
        const VESTING_DURATION_IN_SECS = VESTING_DURATION_IN_DAYS * 24 * 60 * 60
        const VESTING_CLIFF_IN_DAYS = 1
        const VESTING_CLIFF_IN_SECS = VESTING_CLIFF_IN_DAYS * 24 * 60 * 60
        let grantAmount = ethers.BigNumber.from(1000).mul(ethers.BigNumber.from(10).pow(decimals))
        await vesting.addTokenGrant(alice.address, START_TIME, grantAmount, VESTING_DURATION_IN_DAYS, VESTING_CLIFF_IN_DAYS)
        const userVotingPowerBefore = await votingPower.balanceOf(alice.address)
        expect(userVotingPowerBefore).to.eq(grantAmount)
        let newTime = timestamp + 21600 + VESTING_CLIFF_IN_SECS + 60
        let elapsedTime = newTime - START_TIME
        let claimAmount = grantAmount.div(VESTING_DURATION_IN_SECS).mul(elapsedTime)
        let userTokenBalanceBefore = await archToken.balanceOf(alice.address)
        let contractTokenBalanceBefore = await archToken.balanceOf(vesting.address)
        await ethers.provider.send("evm_setNextBlockTimestamp", [newTime])
        await vesting.claimVestedTokens(alice.address)
        expect(await vesting.claimedBalance(alice.address)).to.eq(claimAmount)
        expect(await votingPower.balanceOf(alice.address)).to.eq(userVotingPowerBefore.sub(claimAmount))
        expect(await archToken.balanceOf(alice.address)).to.eq(userTokenBalanceBefore.add(claimAmount))
        expect(await archToken.balanceOf(vesting.address)).to.eq(contractTokenBalanceBefore.sub(claimAmount))
      })

      it("allows user to claim vested tokens multiple times", async function() {
        await vesting.setVotingPowerContract(votingPower.address)
        await archToken.approve(vesting.address, ethers.constants.MaxUint256)
        let decimals = await archToken.decimals()
        const { timestamp } = await ethers.provider.getBlock('latest')
        const START_TIME = timestamp + 21600
        const VESTING_DURATION_IN_DAYS = 4
        const VESTING_DURATION_IN_SECS = VESTING_DURATION_IN_DAYS * 24 * 60 * 60
        const VESTING_CLIFF_IN_DAYS = 1
        const VESTING_CLIFF_IN_SECS = VESTING_CLIFF_IN_DAYS * 24 * 60 * 60
        let grantAmount = ethers.BigNumber.from(1000).mul(ethers.BigNumber.from(10).pow(decimals))
        await vesting.addTokenGrant(alice.address, START_TIME, grantAmount, VESTING_DURATION_IN_DAYS, VESTING_CLIFF_IN_DAYS)
        const userVotingPowerBefore = await votingPower.balanceOf(alice.address)
        expect(userVotingPowerBefore).to.eq(grantAmount)
        let newTime = timestamp + 21600 + VESTING_CLIFF_IN_SECS + 60
        let elapsedTime = newTime - START_TIME
        let claimAmount = grantAmount.div(VESTING_DURATION_IN_SECS).mul(elapsedTime)
        let userTokenBalanceBefore = await archToken.balanceOf(alice.address)
        let contractTokenBalanceBefore = await archToken.balanceOf(vesting.address)
        await ethers.provider.send("evm_setNextBlockTimestamp", [newTime])
        await vesting.claimVestedTokens(alice.address)
        expect(await vesting.claimedBalance(alice.address)).to.eq(claimAmount)
        expect(await votingPower.balanceOf(alice.address)).to.eq(userVotingPowerBefore.sub(claimAmount))
        expect(await archToken.balanceOf(alice.address)).to.eq(userTokenBalanceBefore.add(claimAmount))
        expect(await archToken.balanceOf(vesting.address)).to.eq(contractTokenBalanceBefore.sub(claimAmount))

        newTime = timestamp + 21600 + VESTING_CLIFF_IN_SECS + 60 + 60
        elapsedTime = newTime - START_TIME
        let newClaimAmount = grantAmount.div(VESTING_DURATION_IN_SECS).mul(elapsedTime).sub(claimAmount)
        userTokenBalanceBefore = await archToken.balanceOf(alice.address)
        contractTokenBalanceBefore = await archToken.balanceOf(vesting.address)
        await ethers.provider.send("evm_setNextBlockTimestamp", [newTime])
        await vesting.claimVestedTokens(alice.address)
        expect(await vesting.claimedBalance(alice.address)).to.eq(claimAmount.add(newClaimAmount))
        expect(await votingPower.balanceOf(alice.address)).to.eq(userVotingPowerBefore.sub(claimAmount).sub(newClaimAmount))
        expect(await archToken.balanceOf(alice.address)).to.eq(userTokenBalanceBefore.add(newClaimAmount))
        expect(await archToken.balanceOf(vesting.address)).to.eq(contractTokenBalanceBefore.sub(newClaimAmount))
      })
    })

    context("setVotingPowerContract", async () => {

      it("allows owner to set valid voting power contract", async function() {
        await vesting.setVotingPowerContract(votingPower.address)
        expect(await vesting.votingPower()).to.eq(votingPower.address)
      })

      it("does not allow non-owner to set voting power contract", async function() {
        await expect(vesting.connect(alice).setVotingPowerContract(votingPower.address)).to.revertedWith("revert Vest::setVotingPowerContract: not owner")
        expect(await vesting.votingPower()).to.eq(ZERO_ADDRESS)
      })

      it("does not allow owner to set invalid voting power contract", async function() {
        await expect(vesting.setVotingPowerContract(ZERO_ADDRESS)).to.revertedWith("revert Vest::setVotingPowerContract: not valid contract")
        await expect(vesting.setVotingPowerContract(vesting.address)).to.revertedWith("revert Vest::setVotingPowerContract: not valid contract")
        await expect(vesting.setVotingPowerContract(archToken.address)).to.revertedWith("revert Vest::setVotingPowerContract: not valid contract")
        expect(await vesting.votingPower()).to.eq(ZERO_ADDRESS)
      })
    })

    context("changeOwner", async () => {

      it("allows owner to set new valid owner", async function() {
        await vesting.changeOwner(alice.address)
        expect(await vesting.owner()).to.eq(alice.address)
      })

      it("does not allow non-owner to change owner", async function() {
        await expect(vesting.connect(alice).changeOwner(bob.address)).to.revertedWith("revert Vest::changeOwner: not owner")
        expect(await vesting.owner()).to.eq(deployer.address)
      })

      it("does not allow owner to set invalid owner", async function() {
        await expect(vesting.changeOwner(ZERO_ADDRESS)).to.revertedWith("revert Vest::changeOwner: not valid address")
        await expect(vesting.changeOwner(vesting.address)).to.revertedWith("revert Vest::changeOwner: not valid address")
        await expect(vesting.changeOwner(archToken.address)).to.revertedWith("revert Vest::changeOwner: not valid address")
        expect(await vesting.owner()).to.eq(deployer.address)
      })
    })
  })
})
