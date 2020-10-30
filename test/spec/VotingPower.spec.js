const { expect } = require("chai");
const fs = require('fs')
const { ethers, network } = require("hardhat");
const { governanceFixture } = require("../fixtures")

describe("VotingPower", function() {
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
        carlos = fix.carlos
        ZERO_ADDRESS = fix.ZERO_ADDRESS
    })

    context("Pre-Init", async () => {
        context("archToken", async () => {
            it("reverts", async function() {
                await expect(votingPower.archToken()).to.reverted
            })
        })
    })
    context("Post-Init", async () => {
        beforeEach(async () => {
            await votingPowerPrism.setPendingImplementation(votingPowerImplementation.address)
            await votingPowerImplementation.become(votingPowerPrism.address)
            await votingPower.initialize(archToken.address, vesting.address)
        })
        context("archToken", async () => {
            it("returns the current ARCH token address", async function() {
                expect(await votingPower.archToken()).to.eq(archToken.address)
                expect(await votingPowerImplementation.archToken()).to.eq(ZERO_ADDRESS)
            })
        })

        context("vestingContract", async () => {
            it("returns the current vesting contract address", async function() {
                expect(await votingPower.vestingContract()).to.eq(vesting.address)
                expect(await votingPowerImplementation.vestingContract()).to.eq(ZERO_ADDRESS)
            })
        })

        context("stake", async () => {
            it("allows a valid stake", async function() {
                
            })

            it("does not allow a zero stake amount", async function() {
                await expect(votingPower.stake(0)).to.revertedWith("revert VP::stake: cannot stake 0")
            })

            it("does not allow a user to stake before approval", async function() {
                await expect(votingPower.stake(0)).to.revertedWith("revert VP::stake: cannot stake 0")
            })

        })

        context("stakeWithPermit", async () => {
            it("allows a valid stake", async function() {
                
            })
        })
    })
})
