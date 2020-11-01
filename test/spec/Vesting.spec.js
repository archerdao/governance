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
    let carlos

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
        carlos = fix.carlos
        await votingPowerPrism.setPendingProxyImplementation(votingPowerImplementation.address)
        await votingPowerImplementation.become(votingPowerPrism.address)
        await votingPower.initialize(archToken.address, vesting.address)
    })
  context("addGrant", async () => {
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
          let grantAmount = ethers.BigNumber.from(grant.amount).mul(ethers.BigNumber.from(10).pow(decimals))
          await vesting.addTokenGrant(grant.recipient, START_TIME, grantAmount, VESTING_DURATION_IN_DAYS, VESTING_CLIFF_IN_DAYS)
          const newGrant = await vesting.getTokenGrant(grant.recipient)
          expect(newGrant[0]).to.eq(START_TIME)
          expect(newGrant[1]).to.eq(grantAmount)
          expect(newGrant[2]).to.eq(VESTING_DURATION_IN_DAYS)
          expect(newGrant[3]).to.eq(VESTING_CLIFF_IN_DAYS)
          expect(newGrant[4]).to.eq(0)
          totalVested = totalVested.add(grantAmount)
      }
      
      expect(await archToken.balanceOf(vesting.address)).to.eq(totalVested)
    })
  })
})
