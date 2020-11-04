const { expect } = require("chai");
const fs = require('fs')
const { ethers, network } = require("hardhat");
const { governanceFixture } = require("../fixtures")
const { ecsign } = require("ethereumjs-util")

const DEPLOYER_PRIVATE_KEY = process.env.DEPLOYER_PRIVATE_KEY

const DOMAIN_TYPEHASH = ethers.utils.keccak256(
    ethers.utils.toUtf8Bytes('EIP712Domain(string name,string version,uint256 chainId,address verifyingContract)')
)

const PERMIT_TYPEHASH = ethers.utils.keccak256(
    ethers.utils.toUtf8Bytes('Permit(address owner,address spender,uint256 value,uint256 nonce,uint256 deadline)')
)

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
            await votingPowerPrism.setPendingProxyImplementation(votingPowerImplementation.address)
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
                const userBalanceBefore = await archToken.balanceOf(deployer.address)
                const contractBalanceBefore = await archToken.balanceOf(votingPower.address)
                const totalArchStakedBefore = await votingPower.getTotalARCHAmountStaked()
                const userVotesBefore = await votingPower.getCurrentVotes(deployer.address)
                await archToken.approve(votingPower.address, 1000)
                await votingPower.stake(1000)
                expect(await archToken.balanceOf(deployer.address)).to.eq(userBalanceBefore.sub(1000))
                expect(await archToken.balanceOf(votingPower.address)).to.eq(contractBalanceBefore.add(1000))
                expect(await votingPower.getTotalARCHAmountStaked()).to.eq(totalArchStakedBefore.add(1000))
                expect(await votingPower.getCurrentVotes(deployer.address)).to.eq(userVotesBefore.add(1000))
            })

            it("does not allow a zero stake amount", async function() {
                await expect(votingPower.stake(0)).to.revertedWith("revert VP::stake: cannot stake 0")
            })

            it("does not allow a user to stake more tokens than they have", async function() {
                await expect(votingPower.connect(alice).stake(1000)).to.revertedWith("revert VP::stake: not enough tokens")
            })

            it("does not allow a user to stake before approval", async function() {
                await expect(votingPower.stake(1000)).to.revertedWith("revert VP::stake: must approve tokens before staking")
            })

        })

        context("stakeWithPermit", async () => {
            it("allows a valid stake with permit", async function() {
                const value = 1000
                const userBalanceBefore = await archToken.balanceOf(deployer.address)
                const contractBalanceBefore = await archToken.balanceOf(votingPower.address)
                const totalArchStakedBefore = await votingPower.getTotalARCHAmountStaked()
                const userVotesBefore = await votingPower.getCurrentVotes(deployer.address)
                
                const domainSeparator = ethers.utils.keccak256(
                    ethers.utils.defaultAbiCoder.encode(
                        ['bytes32', 'bytes32', 'bytes32', 'uint256', 'address'],
                        [DOMAIN_TYPEHASH, ethers.utils.keccak256(ethers.utils.toUtf8Bytes(await archToken.name())), ethers.utils.keccak256(ethers.utils.toUtf8Bytes("1")), ethers.provider.network.chainId, archToken.address]
                    )
                )
          
                  
                const nonce = await archToken.nonces(deployer.address)
                const deadline = ethers.constants.MaxUint256
                const digest = ethers.utils.keccak256(
                    ethers.utils.solidityPack(
                        ['bytes1', 'bytes1', 'bytes32', 'bytes32'],
                        [
                        '0x19',
                        '0x01',
                        domainSeparator,
                        ethers.utils.keccak256(
                            ethers.utils.defaultAbiCoder.encode(
                            ['bytes32', 'address', 'address', 'uint256', 'uint256', 'uint256'],
                            [PERMIT_TYPEHASH, deployer.address, votingPower.address, value, nonce, deadline]
                            )
                        ),
                        ]
                    )
                )
        
                const { v, r, s } = ecsign(Buffer.from(digest.slice(2), 'hex'), Buffer.from(DEPLOYER_PRIVATE_KEY.slice(2), 'hex'))
                await votingPower.stakeWithPermit(value, deadline, v, r, s)
                expect(await archToken.balanceOf(deployer.address)).to.eq(userBalanceBefore.sub(value))
                expect(await archToken.balanceOf(votingPower.address)).to.eq(contractBalanceBefore.add(value))
                expect(await votingPower.getTotalARCHAmountStaked()).to.eq(totalArchStakedBefore.add(value))
                expect(await votingPower.getCurrentVotes(deployer.address)).to.eq(userVotesBefore.add(value))
            })

            it("does not allow a zero stake amount", async function() {
                const value = 0
                const domainSeparator = ethers.utils.keccak256(
                    ethers.utils.defaultAbiCoder.encode(
                        ['bytes32', 'bytes32', 'bytes32', 'uint256', 'address'],
                        [DOMAIN_TYPEHASH, ethers.utils.keccak256(ethers.utils.toUtf8Bytes(await archToken.name())), ethers.utils.keccak256(ethers.utils.toUtf8Bytes("1")), ethers.provider.network.chainId, archToken.address]
                    )
                )
          
                  
                const nonce = await archToken.nonces(deployer.address)
                const deadline = ethers.constants.MaxUint256
                const digest = ethers.utils.keccak256(
                    ethers.utils.solidityPack(
                        ['bytes1', 'bytes1', 'bytes32', 'bytes32'],
                        [
                        '0x19',
                        '0x01',
                        domainSeparator,
                        ethers.utils.keccak256(
                            ethers.utils.defaultAbiCoder.encode(
                            ['bytes32', 'address', 'address', 'uint256', 'uint256', 'uint256'],
                            [PERMIT_TYPEHASH, deployer.address, votingPower.address, value, nonce, deadline]
                            )
                        ),
                        ]
                    )
                )
        
                const { v, r, s } = ecsign(Buffer.from(digest.slice(2), 'hex'), Buffer.from(DEPLOYER_PRIVATE_KEY.slice(2), 'hex'))
                await expect(votingPower.stakeWithPermit(value, deadline, v, r, s)).to.revertedWith("revert VP::stakeWithPermit: cannot stake 0")
            })

            it("does not allow a user to stake using a permit signed by someone else", async function() {
                const value = 1000
                const domainSeparator = ethers.utils.keccak256(
                    ethers.utils.defaultAbiCoder.encode(
                        ['bytes32', 'bytes32', 'bytes32', 'uint256', 'address'],
                        [DOMAIN_TYPEHASH, ethers.utils.keccak256(ethers.utils.toUtf8Bytes(await archToken.name())), ethers.utils.keccak256(ethers.utils.toUtf8Bytes("1")), ethers.provider.network.chainId, archToken.address]
                    )
                )
          
                  
                const nonce = await archToken.nonces(alice.address)
                const deadline = ethers.constants.MaxUint256
                const digest = ethers.utils.keccak256(
                    ethers.utils.solidityPack(
                        ['bytes1', 'bytes1', 'bytes32', 'bytes32'],
                        [
                        '0x19',
                        '0x01',
                        domainSeparator,
                        ethers.utils.keccak256(
                            ethers.utils.defaultAbiCoder.encode(
                            ['bytes32', 'address', 'address', 'uint256', 'uint256', 'uint256'],
                            [PERMIT_TYPEHASH, alice.address, votingPower.address, value, nonce, deadline]
                            )
                        ),
                        ]
                    )
                )
        
                const { v, r, s } = ecsign(Buffer.from(digest.slice(2), 'hex'), Buffer.from(DEPLOYER_PRIVATE_KEY.slice(2), 'hex'))
                await expect(votingPower.stakeWithPermit(value, deadline, v, r, s)).to.revertedWith("revert Arch::validateSig: invalid signature")
            })

            it("does not allow a user to stake more tokens than they have", async function() {
                const value = 1000
                const domainSeparator = ethers.utils.keccak256(
                    ethers.utils.defaultAbiCoder.encode(
                        ['bytes32', 'bytes32', 'bytes32', 'uint256', 'address'],
                        [DOMAIN_TYPEHASH, ethers.utils.keccak256(ethers.utils.toUtf8Bytes(await archToken.name())), ethers.utils.keccak256(ethers.utils.toUtf8Bytes("1")), ethers.provider.network.chainId, archToken.address]
                    )
                )
          
                  
                const nonce = await archToken.nonces(alice.address)
                const deadline = ethers.constants.MaxUint256
                const digest = ethers.utils.keccak256(
                    ethers.utils.solidityPack(
                        ['bytes1', 'bytes1', 'bytes32', 'bytes32'],
                        [
                        '0x19',
                        '0x01',
                        domainSeparator,
                        ethers.utils.keccak256(
                            ethers.utils.defaultAbiCoder.encode(
                            ['bytes32', 'address', 'address', 'uint256', 'uint256', 'uint256'],
                            [PERMIT_TYPEHASH, alice.address, votingPower.address, value, nonce, deadline]
                            )
                        ),
                        ]
                    )
                )
        
                const { v, r, s } = ecsign(Buffer.from(digest.slice(2), 'hex'), Buffer.from(DEPLOYER_PRIVATE_KEY.slice(2), 'hex'))
                await expect(votingPower.connect(alice).stakeWithPermit(value, deadline, v, r, s)).to.revertedWith("revert VP::stakeWithPermit: not enough tokens")
            })
        })

        context("addVotingPowerForVestingTokens", async () => {
            it("does not allow user to add 0 voting power", async function() {
                await expect(votingPower.addVotingPowerForVestingTokens(alice.address, 0)).to.revertedWith("revert VP::addVPforVT: cannot add 0 voting power")
            })

            it("does not allow addresses other than the vesting contract to add voting power", async function() {
                await expect(votingPower.addVotingPowerForVestingTokens(alice.address, 1000)).to.revertedWith("revert VP::addVPforVT: only vesting contract")
            })
        })

        context("removeVotingPowerForClaimedTokens", async () => {
            it("does not allow user to remove 0 voting power", async function() {
                await expect(votingPower.removeVotingPowerForClaimedTokens(alice.address, 0)).to.revertedWith("revert VP::removeVPforVT: cannot remove 0 voting power")
            })

            it("does not allow addresses other than the vesting contract to remove voting power", async function() {
                await expect(votingPower.removeVotingPowerForClaimedTokens(alice.address, 1000)).to.revertedWith("revert VP::removeVPforVT: only vesting contract")
            })
        })

        context("withdraw", async () => {
            it("allows a valid withdrawal", async function() {
                const userBalanceBefore = await archToken.balanceOf(deployer.address)
                const contractBalanceBefore = await archToken.balanceOf(votingPower.address)
                const totalArchStakedBefore = await votingPower.getTotalARCHAmountStaked()
                const userVotesBefore = await votingPower.getCurrentVotes(deployer.address)
                await archToken.approve(votingPower.address, 1000)
                await votingPower.stake(1000)
                expect(await archToken.balanceOf(deployer.address)).to.eq(userBalanceBefore.sub(1000))
                expect(await archToken.balanceOf(votingPower.address)).to.eq(contractBalanceBefore.add(1000))
                expect(await votingPower.getTotalARCHAmountStaked()).to.eq(totalArchStakedBefore.add(1000))
                const userVotesAfter = await votingPower.getCurrentVotes(deployer.address)
                expect(userVotesAfter).to.eq(userVotesBefore.add(1000))
                await votingPower.withdraw(1000)
                expect(await archToken.balanceOf(deployer.address)).to.eq(userBalanceBefore)
                expect(await archToken.balanceOf(votingPower.address)).to.eq(contractBalanceBefore)
                expect(await votingPower.getTotalARCHAmountStaked()).to.eq(totalArchStakedBefore)
                expect(await votingPower.getCurrentVotes(deployer.address)).to.eq(0)
            })

            it("does not allow a zero withdrawal amount", async function() {
                await expect(votingPower.withdraw(0)).to.revertedWith("revert VP::withdraw: cannot withdraw 0")
            })

            it("does not allow a user to withdraw more than their current stake", async function() {
                await archToken.approve(votingPower.address, 1000)
                await votingPower.stake(1000)
                await expect(votingPower.withdraw(1001)).to.revertedWith("revert VP::_withdraw: not enough tokens staked")
            })

            it("does not allow a user to withdraw more than they have staked when they have vesting tokens", async function() {
                await archToken.approve(votingPower.address, 1000)
                await votingPower.stake(1000)
                await vesting.setVotingPowerContract(votingPower.address)
                await archToken.approve(vesting.address, ethers.constants.MaxUint256)
                let decimals = await archToken.decimals()
                const START_TIME = Date.now() + 21600
                const VESTING_DURATION_IN_DAYS = 4
                const VESTING_CLIFF_IN_DAYS = 1
                let grantAmount = ethers.BigNumber.from(1000).mul(ethers.BigNumber.from(10).pow(decimals))
                await vesting.addTokenGrant(deployer.address, START_TIME, grantAmount, VESTING_DURATION_IN_DAYS, VESTING_CLIFF_IN_DAYS)
                await expect(votingPower.withdraw(2000)).to.revertedWith("revert VP::_withdraw: not enough tokens staked")
            })
        })
    })
})
