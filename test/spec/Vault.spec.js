const { expect } = require("chai");
const { ethers } = require("hardhat");
const { governanceFixture } = require("../fixtures")
const { ecsign } = require("ethereumjs-util")

const DEPLOYER_PRIVATE_KEY = process.env.DEPLOYER_PRIVATE_KEY

const DOMAIN_TYPEHASH = ethers.utils.keccak256(
    ethers.utils.toUtf8Bytes('EIP712Domain(string name,string version,uint256 chainId,address verifyingContract)')
)

const PERMIT_TYPEHASH = ethers.utils.keccak256(
    ethers.utils.toUtf8Bytes('Permit(address owner,address spender,uint256 value,uint256 nonce,uint256 deadline)')
)

describe("Vault", function() {
    let archToken
    let vault
    let deployer
    let alice
    let bob
    let ZERO_ADDRESS

    beforeEach(async () => {
        const fix = await governanceFixture()
        archToken = fix.archToken
        vault = fix.vault
        deployer = fix.deployer
        alice = fix.alice
        bob = fix.bob
        ZERO_ADDRESS = fix.ZERO_ADDRESS
    })

    context("lockTokens", async () => {
        it("creates valid lock of Arch tokens", async function() {
            await archToken.approve(vault.address, ethers.constants.MaxUint256)
            let decimals = await archToken.decimals()
            const START_TIME = parseInt(Date.now() / 1000) + 21600
            const DURATION_IN_DAYS = 4
            let totalLocked = await archToken.balanceOf(vault.address)
            let lockAmount = ethers.BigNumber.from(1000).mul(ethers.BigNumber.from(10).pow(decimals))
            await vault.lockTokens(archToken.address, deployer.address, alice.address, START_TIME, lockAmount, DURATION_IN_DAYS, false)
            const activeLocks = await vault.getAllActiveLocks(alice.address)
            const newLock = activeLocks[0]
            expect(newLock[0]).to.eq(archToken.address)
            expect(newLock[1]).to.eq(alice.address)
            expect(newLock[2]).to.eq(START_TIME)
            expect(newLock[3]).to.eq(lockAmount)
            expect(newLock[4]).to.eq(DURATION_IN_DAYS)
            expect(newLock[5]).to.eq(0)
            totalLocked = totalLocked.add(lockAmount)
            expect(await archToken.balanceOf(vault.address)).to.eq(totalLocked)
        })

        it("does not allow a lock with a duration of 0", async function() {
            await archToken.approve(vault.address, ethers.constants.MaxUint256)
            let decimals = await archToken.decimals()
            const START_TIME = parseInt(Date.now() / 1000) + 21600
            const DURATION_IN_DAYS = 0
            let totalLocked = await archToken.balanceOf(vault.address)
            let lockAmount = ethers.BigNumber.from(1000).mul(ethers.BigNumber.from(10).pow(decimals))
            await expect(vault.lockTokens(archToken.address, deployer.address, bob.address, START_TIME, lockAmount, DURATION_IN_DAYS, false)).to.revertedWith("revert Vault::lockTokens: duration must be > 0")
            expect(await archToken.balanceOf(vault.address)).to.eq(totalLocked)
            const emptyLocks = await vault.getAllActiveLocks(bob.address)
            expect(emptyLocks.length).to.eq(0)
        })

        it("does not allow a lock with a duration of > 25 years", async function() {
            await archToken.approve(vault.address, ethers.constants.MaxUint256)
            let decimals = await archToken.decimals()
            const START_TIME = parseInt(Date.now() / 1000) + 21600
            const DURATION_IN_DAYS = 26 * 365
            let totalLocked = await archToken.balanceOf(vault.address)
            let lockAmount = ethers.BigNumber.from(1000).mul(ethers.BigNumber.from(10).pow(decimals))
            await expect(vault.lockTokens(archToken.address, deployer.address, bob.address, START_TIME, lockAmount, DURATION_IN_DAYS, false)).to.revertedWith("revert Vault::lockTokens: duration more than 25 years")
            expect(await archToken.balanceOf(vault.address)).to.eq(totalLocked)
            const emptyLocks = await vault.getAllActiveLocks(bob.address)
            expect(emptyLocks.length).to.eq(0)
        })

        it("does not allow a lock of 0", async function() {
            await archToken.approve(vault.address, ethers.constants.MaxUint256)
            let decimals = await archToken.decimals()
            const START_TIME = parseInt(Date.now() / 1000) + 21600
            const DURATION_IN_DAYS = 4
            let totalLocked = await archToken.balanceOf(vault.address)
            let lockAmount = ethers.BigNumber.from(0).mul(ethers.BigNumber.from(10).pow(decimals))
            await expect(vault.lockTokens(archToken.address, deployer.address, bob.address, START_TIME, lockAmount, DURATION_IN_DAYS, false)).to.revertedWith("revert Vault::lockTokens: amount not > 0")
            expect(await archToken.balanceOf(vault.address)).to.eq(totalLocked)
            const emptyLocks = await vault.getAllActiveLocks(bob.address)
            expect(emptyLocks.length).to.eq(0)
        })

        it("does not allow a lock when locker has insufficient balance", async function() {
            await archToken.approve(vault.address, ethers.constants.MaxUint256)
            await archToken.transfer(bob.address, await archToken.balanceOf(deployer.address))
            let decimals = await archToken.decimals()
            const START_TIME = parseInt(Date.now() / 1000) + 21600
            const DURATION_IN_DAYS = 4
            let totalLocked = await archToken.balanceOf(vault.address)
            let lockAmount = ethers.BigNumber.from(1000).mul(ethers.BigNumber.from(10).pow(decimals))
            await expect(vault.lockTokens(archToken.address, deployer.address, bob.address, START_TIME, lockAmount, DURATION_IN_DAYS, false)).to.revertedWith("revert Arch::_transferTokens: transfer exceeds from balance")
            expect(await archToken.balanceOf(vault.address)).to.eq(totalLocked)
            const emptyLocks = await vault.getAllActiveLocks(bob.address)
            expect(emptyLocks.length).to.eq(0)
        })
    })

    context("lockTokensWithPermit", async () => {
        it("creates valid lock of Arch tokens", async function() {
            let decimals = await archToken.decimals()
            const START_TIME = parseInt(Date.now() / 1000) + 21600
            const DURATION_IN_DAYS = 4
            let totalLocked = await archToken.balanceOf(vault.address)
            let lockAmount = ethers.BigNumber.from(1000).mul(ethers.BigNumber.from(10).pow(decimals))
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
                        [PERMIT_TYPEHASH, deployer.address, vault.address, lockAmount, nonce, deadline]
                        )
                    ),
                    ]
                )
            )
    
            const { v, r, s } = ecsign(Buffer.from(digest.slice(2), 'hex'), Buffer.from(DEPLOYER_PRIVATE_KEY, 'hex'))
            
            await vault.lockTokensWithPermit(archToken.address, deployer.address, alice.address, START_TIME, lockAmount, DURATION_IN_DAYS, false, deadline, v, r, s)
            const activeLocks = await vault.getAllActiveLocks(alice.address)
            const newLock = activeLocks[0]
            expect(newLock[0]).to.eq(archToken.address)
            expect(newLock[1]).to.eq(alice.address)
            expect(newLock[2]).to.eq(START_TIME)
            expect(newLock[3]).to.eq(lockAmount)
            expect(newLock[4]).to.eq(DURATION_IN_DAYS)
            expect(newLock[5]).to.eq(0)
            totalLocked = totalLocked.add(lockAmount)
            expect(await archToken.balanceOf(vault.address)).to.eq(totalLocked)
        })

        it("does not allow a lock with a duration of 0", async function() {
            let decimals = await archToken.decimals()
            const START_TIME = parseInt(Date.now() / 1000) + 21600
            const DURATION_IN_DAYS = 0
            let totalLocked = await archToken.balanceOf(vault.address)
            let lockAmount = ethers.BigNumber.from(1000).mul(ethers.BigNumber.from(10).pow(decimals))
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
                        [PERMIT_TYPEHASH, deployer.address, vault.address, lockAmount, nonce, deadline]
                        )
                    ),
                    ]
                )
            )
    
            const { v, r, s } = ecsign(Buffer.from(digest.slice(2), 'hex'), Buffer.from(DEPLOYER_PRIVATE_KEY, 'hex'))
            
            await expect(vault.lockTokensWithPermit(archToken.address, deployer.address, alice.address, START_TIME, lockAmount, DURATION_IN_DAYS, false, deadline, v, r, s)).to.revertedWith("revert Vault::lockTokensWithPermit: duration must be > 0")
            expect(await archToken.balanceOf(vault.address)).to.eq(totalLocked)
            const emptyLocks = await vault.getAllActiveLocks(bob.address)
            expect(emptyLocks.length).to.eq(0)
        })

        it("does not allow a lock with a duration of > 25 years", async function() {
            let decimals = await archToken.decimals()
            const START_TIME = parseInt(Date.now() / 1000) + 21600
            const DURATION_IN_DAYS = 26 * 365
            let totalLocked = await archToken.balanceOf(vault.address)
            let lockAmount = ethers.BigNumber.from(1000).mul(ethers.BigNumber.from(10).pow(decimals))
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
                        [PERMIT_TYPEHASH, deployer.address, vault.address, lockAmount, nonce, deadline]
                        )
                    ),
                    ]
                )
            )
    
            const { v, r, s } = ecsign(Buffer.from(digest.slice(2), 'hex'), Buffer.from(DEPLOYER_PRIVATE_KEY, 'hex'))
    
            await expect(vault.lockTokensWithPermit(archToken.address, deployer.address, alice.address, START_TIME, lockAmount, DURATION_IN_DAYS, false, deadline, v, r, s)).to.revertedWith("revert Vault::lockTokensWithPermit: duration more than 25 years")
            expect(await archToken.balanceOf(vault.address)).to.eq(totalLocked)
            const emptyLocks = await vault.getAllActiveLocks(bob.address)
            expect(emptyLocks.length).to.eq(0)
        })

        it("does not allow a lock of 0", async function() {
            const START_TIME = parseInt(Date.now() / 1000) + 21600
            const DURATION_IN_DAYS = 4
            let totalLocked = await archToken.balanceOf(vault.address)
            let lockAmount = ethers.BigNumber.from(0)
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
                        [PERMIT_TYPEHASH, deployer.address, vault.address, lockAmount, nonce, deadline]
                        )
                    ),
                    ]
                )
            )
    
            const { v, r, s } = ecsign(Buffer.from(digest.slice(2), 'hex'), Buffer.from(DEPLOYER_PRIVATE_KEY, 'hex'))
            await expect(vault.lockTokensWithPermit(archToken.address, deployer.address, alice.address, START_TIME, lockAmount, DURATION_IN_DAYS, false, deadline, v, r, s)).to.revertedWith("revert Vault::lockTokensWithPermit: amount not > 0")
            expect(await archToken.balanceOf(vault.address)).to.eq(totalLocked)
            const emptyLocks = await vault.getAllActiveLocks(bob.address)
            expect(emptyLocks.length).to.eq(0)
        })

        it("does not allow a lock when locker has insufficient balance", async function() {
            let decimals = await archToken.decimals()
            const START_TIME = parseInt(Date.now() / 1000) + 21600
            const DURATION_IN_DAYS = 4
            let totalLocked = await archToken.balanceOf(vault.address)
            let lockAmount = ethers.BigNumber.from(1000).mul(ethers.BigNumber.from(10).pow(decimals))
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
                        [PERMIT_TYPEHASH, deployer.address, vault.address, lockAmount, nonce, deadline]
                        )
                    ),
                    ]
                )
            )
    
            const { v, r, s } = ecsign(Buffer.from(digest.slice(2), 'hex'), Buffer.from(DEPLOYER_PRIVATE_KEY, 'hex'))
            
            
            await archToken.transfer(bob.address, await archToken.balanceOf(deployer.address))
            await expect(vault.lockTokensWithPermit(archToken.address, deployer.address, alice.address, START_TIME, lockAmount, DURATION_IN_DAYS, false, deadline, v, r, s)).to.revertedWith("revert Arch::_transferTokens: transfer exceeds from balance")
            expect(await archToken.balanceOf(vault.address)).to.eq(totalLocked)
            const emptyLocks = await vault.getAllActiveLocks(bob.address)
            expect(emptyLocks.length).to.eq(0)
        })
    })

    context("getLockedTokenBalance", async () => {
        it("returns 0 if locked token balance does not exist", async function() {
          await archToken.approve(vault.address, ethers.constants.MaxUint256)
          let decimals = await archToken.decimals()
          const { timestamp } = await ethers.provider.getBlock('latest')
          const START_TIME = timestamp + 21600
          const DURATION_IN_DAYS = 4
          let lockAmount = ethers.BigNumber.from(1000).mul(ethers.BigNumber.from(10).pow(decimals))
          await vault.lockTokens(archToken.address, deployer.address, bob.address, START_TIME, lockAmount, DURATION_IN_DAYS, false)
          expect(await vault.getLockedTokenBalance(ZERO_ADDRESS, bob.address)).to.eq(0)
        })
  
        it("returns 0 after lock duration has ended", async function() {
          await archToken.approve(vault.address, ethers.constants.MaxUint256)
          let decimals = await archToken.decimals()
          const { timestamp } = await ethers.provider.getBlock('latest')
          const START_TIME = timestamp + 21600
          const DURATION_IN_DAYS = 4
          const DURATION_IN_SECS = DURATION_IN_DAYS * 24 * 60 * 60
          let lockAmount = ethers.BigNumber.from(1000).mul(ethers.BigNumber.from(10).pow(decimals))
          await vault.lockTokens(archToken.address, deployer.address, bob.address, START_TIME, lockAmount, DURATION_IN_DAYS, false)
          await ethers.provider.send("evm_setNextBlockTimestamp", [timestamp + 21600 + DURATION_IN_SECS])
          await ethers.provider.send("evm_mine")
          expect(await vault.getLockedTokenBalance(archToken.address, bob.address)).to.eq(0)
        })
  
        it("returns total locked tokens if before duration has ended", async function() {
          await archToken.approve(vault.address, ethers.constants.MaxUint256)
          let decimals = await archToken.decimals()
          const { timestamp } = await ethers.provider.getBlock('latest')
          const START_TIME = timestamp + 21600
          const DURATION_IN_DAYS = 4
          let lockAmount = ethers.BigNumber.from(1000).mul(ethers.BigNumber.from(10).pow(decimals))
          await vault.lockTokens(archToken.address, deployer.address, bob.address, START_TIME, lockAmount, DURATION_IN_DAYS, false)
          expect(await vault.getLockedTokenBalance(archToken.address, bob.address)).to.eq(lockAmount)
        })

        it("returns total locked tokens if before duration has ended (multiple balances)", async function() {
            await archToken.approve(vault.address, ethers.constants.MaxUint256)
            let decimals = await archToken.decimals()
            const { timestamp } = await ethers.provider.getBlock('latest')
            const START_TIME = timestamp + 21600
            const DURATION_IN_DAYS = 4
            let lockAmount = ethers.BigNumber.from(1000).mul(ethers.BigNumber.from(10).pow(decimals))
            await vault.lockTokens(archToken.address, deployer.address, bob.address, START_TIME, lockAmount, DURATION_IN_DAYS, false)
            await vault.lockTokens(archToken.address, deployer.address, bob.address, START_TIME, lockAmount, DURATION_IN_DAYS, false)
            expect(await vault.getLockedTokenBalance(archToken.address, bob.address)).to.eq(lockAmount.mul(2))
        })

        it("returns correct locked tokens for balances at different stages (multiple)", async function() {
            await archToken.approve(vault.address, ethers.constants.MaxUint256)
            let decimals = await archToken.decimals()
            const { timestamp } = await ethers.provider.getBlock('latest')
            const START_TIME = timestamp + 21600
            const DURATION_IN_DAYS = 4
            const DURATION_IN_SECS = DURATION_IN_DAYS * 24 * 60 * 60
            let lockAmount = ethers.BigNumber.from(1000).mul(ethers.BigNumber.from(10).pow(decimals))
            await vault.lockTokens(archToken.address, deployer.address, bob.address, START_TIME, lockAmount, DURATION_IN_DAYS, false)
            await vault.lockTokens(archToken.address, deployer.address, bob.address, START_TIME, lockAmount, DURATION_IN_DAYS * 2, false)
            await ethers.provider.send("evm_setNextBlockTimestamp", [timestamp + 21600 + DURATION_IN_SECS])
            await ethers.provider.send("evm_mine")
            expect(await vault.getLockedTokenBalance(archToken.address, bob.address)).to.eq(lockAmount)
        })
    })

    context("getUnlockedTokenBalance", async () => {
        it("returns 0 if locked token balance does not exist", async function() {
          await archToken.approve(vault.address, ethers.constants.MaxUint256)
          let decimals = await archToken.decimals()
          const { timestamp } = await ethers.provider.getBlock('latest')
          const START_TIME = timestamp + 21600
          const DURATION_IN_DAYS = 4
          let lockAmount = ethers.BigNumber.from(1000).mul(ethers.BigNumber.from(10).pow(decimals))
          await vault.lockTokens(archToken.address, deployer.address, bob.address, START_TIME, lockAmount, DURATION_IN_DAYS, false)
          expect(await vault.getUnlockedTokenBalance(ZERO_ADDRESS, bob.address)).to.eq(0)
        })
  
        it("returns total amount after lock duration has ended and none claimed", async function() {
          await archToken.approve(vault.address, ethers.constants.MaxUint256)
          let decimals = await archToken.decimals()
          const { timestamp } = await ethers.provider.getBlock('latest')
          const START_TIME = timestamp + 21600
          const DURATION_IN_DAYS = 4
          const DURATION_IN_SECS = DURATION_IN_DAYS * 24 * 60 * 60
          let lockAmount = ethers.BigNumber.from(1000).mul(ethers.BigNumber.from(10).pow(decimals))
          await vault.lockTokens(archToken.address, deployer.address, bob.address, START_TIME, lockAmount, DURATION_IN_DAYS, false)
          await ethers.provider.send("evm_setNextBlockTimestamp", [timestamp + 21600 + DURATION_IN_SECS])
          await ethers.provider.send("evm_mine")
          expect(await vault.getUnlockedTokenBalance(archToken.address, bob.address)).to.eq(lockAmount)
        })

        it("returns correct amount after lock duration has ended and some claimed", async function() {
            await archToken.approve(vault.address, ethers.constants.MaxUint256)
            let decimals = await archToken.decimals()
            const { timestamp } = await ethers.provider.getBlock('latest')
            const START_TIME = timestamp + 21600
            const DURATION_IN_DAYS = 4
            const DURATION_IN_SECS = DURATION_IN_DAYS * 24 * 60 * 60
            let lockAmount = ethers.BigNumber.from(1000).mul(ethers.BigNumber.from(10).pow(decimals))
            await vault.lockTokens(archToken.address, deployer.address, bob.address, START_TIME, lockAmount, DURATION_IN_DAYS, false)
            await ethers.provider.send("evm_setNextBlockTimestamp", [timestamp + 21600 + DURATION_IN_SECS])
            await ethers.provider.send("evm_mine")
            let claimAmount = ethers.BigNumber.from(100).mul(ethers.BigNumber.from(10).pow(decimals))
            await vault.connect(bob).claimUnlockedTokens([0], [claimAmount])
            expect(await vault.getUnlockedTokenBalance(archToken.address, bob.address)).to.eq(lockAmount.sub(claimAmount))
        })
  
        it("returns 0 if before duration has ended", async function() {
          await archToken.approve(vault.address, ethers.constants.MaxUint256)
          let decimals = await archToken.decimals()
          const { timestamp } = await ethers.provider.getBlock('latest')
          const START_TIME = timestamp + 21600
          const DURATION_IN_DAYS = 4
          let lockAmount = ethers.BigNumber.from(1000).mul(ethers.BigNumber.from(10).pow(decimals))
          await vault.lockTokens(archToken.address, deployer.address, bob.address, START_TIME, lockAmount, DURATION_IN_DAYS, false)
          expect(await vault.getUnlockedTokenBalance(archToken.address, bob.address)).to.eq(0)
        })
    })

    context("getLockedBalance", async () => {
        it("returns 0 if lock id does not exist", async function() {
          await archToken.approve(vault.address, ethers.constants.MaxUint256)
          let decimals = await archToken.decimals()
          const { timestamp } = await ethers.provider.getBlock('latest')
          const START_TIME = timestamp + 21600
          const DURATION_IN_DAYS = 4
          let lockAmount = ethers.BigNumber.from(1000).mul(ethers.BigNumber.from(10).pow(decimals))
          await vault.lockTokens(archToken.address, deployer.address, bob.address, START_TIME, lockAmount, DURATION_IN_DAYS, false)
          expect(await vault.getLockedBalance(1)).to.eq(0)
        })
  
        it("returns 0 after lock duration has ended", async function() {
          await archToken.approve(vault.address, ethers.constants.MaxUint256)
          let decimals = await archToken.decimals()
          const { timestamp } = await ethers.provider.getBlock('latest')
          const START_TIME = timestamp + 21600
          const DURATION_IN_DAYS = 4
          const DURATION_IN_SECS = DURATION_IN_DAYS * 24 * 60 * 60
          let lockAmount = ethers.BigNumber.from(1000).mul(ethers.BigNumber.from(10).pow(decimals))
          await vault.lockTokens(archToken.address, deployer.address, bob.address, START_TIME, lockAmount, DURATION_IN_DAYS, false)
          await ethers.provider.send("evm_setNextBlockTimestamp", [timestamp + 21600 + DURATION_IN_SECS])
          await ethers.provider.send("evm_mine")
          expect(await vault.getLockedBalance(0)).to.eq(0)
        })
  
        it("returns total locked tokens if before duration has ended", async function() {
          await archToken.approve(vault.address, ethers.constants.MaxUint256)
          let decimals = await archToken.decimals()
          const { timestamp } = await ethers.provider.getBlock('latest')
          const START_TIME = timestamp + 21600
          const DURATION_IN_DAYS = 4
          let lockAmount = ethers.BigNumber.from(1000).mul(ethers.BigNumber.from(10).pow(decimals))
          await vault.lockTokens(archToken.address, deployer.address, bob.address, START_TIME, lockAmount, DURATION_IN_DAYS, false)
          expect(await vault.getLockedBalance(0)).to.eq(lockAmount)
        })
    })

    context("getUnlockedBalance", async () => {
      it("returns 0 before lock start time", async function() {
        await archToken.approve(vault.address, ethers.constants.MaxUint256)
        let decimals = await archToken.decimals()
        const { timestamp } = await ethers.provider.getBlock('latest')
        const START_TIME = timestamp + 21600
        const DURATION_IN_DAYS = 4
        let lockAmount = ethers.BigNumber.from(1000).mul(ethers.BigNumber.from(10).pow(decimals))
        await vault.lockTokens(archToken.address, deployer.address, bob.address, START_TIME, lockAmount, DURATION_IN_DAYS, false)
        expect(await vault.getUnlockedBalance(0)).to.eq(0)
      })

      it("returns 0 before lock duration", async function() {
        await archToken.approve(vault.address, ethers.constants.MaxUint256)
        let decimals = await archToken.decimals()
        const { timestamp } = await ethers.provider.getBlock('latest')
        const START_TIME = timestamp + 21600
        const DURATION_IN_DAYS = 4
        let lockAmount = ethers.BigNumber.from(1000).mul(ethers.BigNumber.from(10).pow(decimals))
        await vault.lockTokens(archToken.address, deployer.address, bob.address, START_TIME, lockAmount, DURATION_IN_DAYS, false)
        await ethers.provider.send("evm_setNextBlockTimestamp", [timestamp + 21600])
        await ethers.provider.send("evm_mine")
        expect(await vault.getUnlockedBalance(0)).to.eq(0)
      })

      it("returns total unlocked tokens if after duration and none claimed", async function() {
        await archToken.approve(vault.address, ethers.constants.MaxUint256)
        let decimals = await archToken.decimals()
        const { timestamp } = await ethers.provider.getBlock('latest')
        const START_TIME = timestamp + 21600
        const DURATION_IN_DAYS = 4
        const DURATION_IN_SECS = DURATION_IN_DAYS * 24 * 60 * 60
        let lockAmount = ethers.BigNumber.from(1000).mul(ethers.BigNumber.from(10).pow(decimals))
        await vault.lockTokens(archToken.address, deployer.address, bob.address, START_TIME, lockAmount, DURATION_IN_DAYS, false)
        await ethers.provider.send("evm_setNextBlockTimestamp", [timestamp + 21600 + DURATION_IN_SECS])
        await ethers.provider.send("evm_mine")
        expect(await vault.getUnlockedBalance(0)).to.eq(lockAmount)
      })

      it("returns remaining unlocked tokens if after duration and some claimed", async function() {
        await archToken.approve(vault.address, ethers.constants.MaxUint256)
        let decimals = await archToken.decimals()
        const { timestamp } = await ethers.provider.getBlock('latest')
        const START_TIME = timestamp + 21600
        const DURATION_IN_DAYS = 4
        const DURATION_IN_SECS = DURATION_IN_DAYS * 24 * 60 * 60
        let lockAmount = ethers.BigNumber.from(1000).mul(ethers.BigNumber.from(10).pow(decimals))
        await vault.lockTokens(archToken.address, deployer.address, bob.address, START_TIME, lockAmount, DURATION_IN_DAYS, false)
        await ethers.provider.send("evm_setNextBlockTimestamp", [timestamp + 21600 + DURATION_IN_SECS])
        let claimAmount = ethers.BigNumber.from(100).mul(ethers.BigNumber.from(10).pow(decimals))
        await vault.connect(bob).claimUnlockedTokens([0], [claimAmount])
        expect(await vault.getUnlockedBalance(0)).to.eq(lockAmount.sub(claimAmount))
      })
    })

    context("claimUnlockedTokens", async () => {
        it("does not allow user to claim if no tokens are unlocked", async function() {
            await archToken.approve(vault.address, ethers.constants.MaxUint256)
            let decimals = await archToken.decimals()
            const { timestamp } = await ethers.provider.getBlock('latest')
            const START_TIME = timestamp + 21600
            const DURATION_IN_DAYS = 4
            let lockAmount = ethers.BigNumber.from(1000).mul(ethers.BigNumber.from(10).pow(decimals))
            await vault.lockTokens(archToken.address, deployer.address, bob.address, START_TIME, lockAmount, DURATION_IN_DAYS, false)
            await expect(vault.connect(bob).claimUnlockedTokens([0], [lockAmount])).to.revertedWith("revert Vault::claimUnlockedTokens: unlockedAmount < amount")
        })

        it("allows user to claim unlocked tokens once", async function() {
            await archToken.approve(vault.address, ethers.constants.MaxUint256)
            let decimals = await archToken.decimals()
            const { timestamp } = await ethers.provider.getBlock('latest')
            const START_TIME = timestamp + 21600
            const DURATION_IN_DAYS = 4
            const DURATION_IN_SECS = DURATION_IN_DAYS * 24 * 60 * 60
            let lockAmount = ethers.BigNumber.from(1000).mul(ethers.BigNumber.from(10).pow(decimals))
            await vault.lockTokens(archToken.address, deployer.address, alice.address, START_TIME, lockAmount, DURATION_IN_DAYS, false)
            let userTokenBalanceBefore = await archToken.balanceOf(alice.address)
            let contractTokenBalanceBefore = await archToken.balanceOf(vault.address)
            let newTime = timestamp + 21600 + DURATION_IN_SECS + 60
            await ethers.provider.send("evm_setNextBlockTimestamp", [newTime])
            await vault.connect(alice).claimUnlockedTokens([0], [lockAmount])
            expect(await vault.getUnlockedBalance(0)).to.eq(0)
            expect(await archToken.balanceOf(alice.address)).to.eq(userTokenBalanceBefore.add(lockAmount))
            expect(await archToken.balanceOf(vault.address)).to.eq(contractTokenBalanceBefore.sub(lockAmount))
        })

        it("allows user to claim unlocked tokens multiple times", async function() {
            await archToken.approve(vault.address, ethers.constants.MaxUint256)
            let decimals = await archToken.decimals()
            const { timestamp } = await ethers.provider.getBlock('latest')
            const START_TIME = timestamp + 21600
            const DURATION_IN_DAYS = 4
            const DURATION_IN_SECS = DURATION_IN_DAYS * 24 * 60 * 60
            let lockAmount = ethers.BigNumber.from(1000).mul(ethers.BigNumber.from(10).pow(decimals))
            await vault.lockTokens(archToken.address, deployer.address, alice.address, START_TIME, lockAmount, DURATION_IN_DAYS, false)
            let userTokenBalanceBefore = await archToken.balanceOf(alice.address)
            let contractTokenBalanceBefore = await archToken.balanceOf(vault.address)
            let newTime = timestamp + 21600 + DURATION_IN_SECS + 60
            await ethers.provider.send("evm_setNextBlockTimestamp", [newTime])
            let claimAmount = ethers.BigNumber.from(100).mul(ethers.BigNumber.from(10).pow(decimals))
            await vault.connect(alice).claimUnlockedTokens([0], [claimAmount])
            expect(await vault.getUnlockedBalance(0)).to.eq(lockAmount.sub(claimAmount))
            expect(await archToken.balanceOf(alice.address)).to.eq(userTokenBalanceBefore.add(claimAmount))
            expect(await archToken.balanceOf(vault.address)).to.eq(contractTokenBalanceBefore.sub(claimAmount))
            
            await vault.connect(alice).claimUnlockedTokens([0], [claimAmount])
            expect(await vault.getUnlockedBalance(0)).to.eq(lockAmount.sub(claimAmount.mul(2)))
            expect(await archToken.balanceOf(alice.address)).to.eq(userTokenBalanceBefore.add(claimAmount.mul(2)))
            expect(await archToken.balanceOf(vault.address)).to.eq(contractTokenBalanceBefore.sub(claimAmount.mul(2)))
            
            await vault.connect(alice).claimUnlockedTokens([0], [lockAmount.sub(claimAmount.mul(2))])
            expect(await vault.getUnlockedBalance(0)).to.eq(0)
            expect(await archToken.balanceOf(alice.address)).to.eq(lockAmount)
            expect(await archToken.balanceOf(vault.address)).to.eq(0)
        })

        it("does not allow user to claim unlocked tokens on behalf of someone else", async function() {
            await archToken.approve(vault.address, ethers.constants.MaxUint256)
            let decimals = await archToken.decimals()
            const { timestamp } = await ethers.provider.getBlock('latest')
            const START_TIME = timestamp + 21600
            const DURATION_IN_DAYS = 4
            const DURATION_IN_SECS = DURATION_IN_DAYS * 24 * 60 * 60
            let lockAmount = ethers.BigNumber.from(1000).mul(ethers.BigNumber.from(10).pow(decimals))
            await vault.lockTokens(archToken.address, deployer.address, alice.address, START_TIME, lockAmount, DURATION_IN_DAYS, false)
            
            let newTime = timestamp + 21600 + DURATION_IN_SECS + 60
            await ethers.provider.send("evm_setNextBlockTimestamp", [newTime])
        
            await expect(vault.claimUnlockedTokens([0], [lockAmount])).to.revertedWith("revert Vault::claimUnlockedTokens: msg.sender must be receiver")
        })
    })

    context("claimAllUnlockedTokens", async () => {
        it("does not allow user to claim if no tokens are unlocked", async function() {
          await archToken.approve(vault.address, ethers.constants.MaxUint256)
          let decimals = await archToken.decimals()
          const { timestamp } = await ethers.provider.getBlock('latest')
          const START_TIME = timestamp + 21600
          const DURATION_IN_DAYS = 4
          let lockAmount = ethers.BigNumber.from(1000).mul(ethers.BigNumber.from(10).pow(decimals))
          await vault.lockTokens(archToken.address, deployer.address, bob.address, START_TIME, lockAmount, DURATION_IN_DAYS, false)
          await expect(vault.connect(bob).claimAllUnlockedTokens([0])).to.revertedWith("revert Vault::claimAllUnlockedTokens: unlockedAmount is 0")
        })
  
        it("allows user to claim unlocked tokens once", async function() {
          await archToken.approve(vault.address, ethers.constants.MaxUint256)
          let decimals = await archToken.decimals()
          const { timestamp } = await ethers.provider.getBlock('latest')
          const START_TIME = timestamp + 21600
          const DURATION_IN_DAYS = 4
          const DURATION_IN_SECS = DURATION_IN_DAYS * 24 * 60 * 60
          let lockAmount = ethers.BigNumber.from(1000).mul(ethers.BigNumber.from(10).pow(decimals))
          await vault.lockTokens(archToken.address, deployer.address, alice.address, START_TIME, lockAmount, DURATION_IN_DAYS, false)
          let userTokenBalanceBefore = await archToken.balanceOf(alice.address)
          let contractTokenBalanceBefore = await archToken.balanceOf(vault.address)
          let newTime = timestamp + 21600 + DURATION_IN_SECS + 60
          await ethers.provider.send("evm_setNextBlockTimestamp", [newTime])
          await vault.connect(alice).claimAllUnlockedTokens([0])
          expect(await vault.getUnlockedBalance(0)).to.eq(0)
          expect(await archToken.balanceOf(alice.address)).to.eq(userTokenBalanceBefore.add(lockAmount))
          expect(await archToken.balanceOf(vault.address)).to.eq(contractTokenBalanceBefore.sub(lockAmount))
        })
  
        it("does not allow user to claim unlocked tokens multiple times", async function() {
          await archToken.approve(vault.address, ethers.constants.MaxUint256)
          let decimals = await archToken.decimals()
          const { timestamp } = await ethers.provider.getBlock('latest')
          const START_TIME = timestamp + 21600
          const DURATION_IN_DAYS = 4
          const DURATION_IN_SECS = DURATION_IN_DAYS * 24 * 60 * 60
          let lockAmount = ethers.BigNumber.from(1000).mul(ethers.BigNumber.from(10).pow(decimals))
          await vault.lockTokens(archToken.address, deployer.address, alice.address, START_TIME, lockAmount, DURATION_IN_DAYS, false)

          let newTime = timestamp + 21600 + DURATION_IN_SECS + 60
          await ethers.provider.send("evm_setNextBlockTimestamp", [newTime])
        
          await vault.connect(alice).claimAllUnlockedTokens([0])
          expect(await vault.getUnlockedBalance(0)).to.eq(0)
          expect(await archToken.balanceOf(alice.address)).to.eq(lockAmount)
          expect(await archToken.balanceOf(vault.address)).to.eq(0)

          await expect(vault.connect(alice).claimAllUnlockedTokens([0])).to.revertedWith("revert Vault::claimAllUnlockedTokens: unlockedAmount is 0")
        })

        it("does not allow user to claim unlocked tokens on behalf of someone else", async function() {
            await archToken.approve(vault.address, ethers.constants.MaxUint256)
            let decimals = await archToken.decimals()
            const { timestamp } = await ethers.provider.getBlock('latest')
            const START_TIME = timestamp + 21600
            const DURATION_IN_DAYS = 4
            const DURATION_IN_SECS = DURATION_IN_DAYS * 24 * 60 * 60
            let lockAmount = ethers.BigNumber.from(1000).mul(ethers.BigNumber.from(10).pow(decimals))
            await vault.lockTokens(archToken.address, deployer.address, alice.address, START_TIME, lockAmount, DURATION_IN_DAYS, false)
            
            let newTime = timestamp + 21600 + DURATION_IN_SECS + 60
            await ethers.provider.send("evm_setNextBlockTimestamp", [newTime])
          
            await expect(vault.claimAllUnlockedTokens([0])).to.revertedWith("revert Vault::claimAllUnlockedTokens: msg.sender must be receiver")
        })
    })

    context("extendLock", async () => {
        it("allows receiver to extend a lock", async function() {
            await archToken.approve(vault.address, ethers.constants.MaxUint256)
            let decimals = await archToken.decimals()
            const { timestamp } = await ethers.provider.getBlock('latest')
            const START_TIME = timestamp + 21600
            const ORIGINAL_DURATION_IN_DAYS = 4
            const SIX_MONTHS_IN_DAYS = 6 * 30
            let lockAmount = ethers.BigNumber.from(1000).mul(ethers.BigNumber.from(10).pow(decimals))
            await vault.lockTokens(archToken.address, deployer.address, bob.address, START_TIME, lockAmount, ORIGINAL_DURATION_IN_DAYS, false)
            let lock = await vault.getTokenLock(0)
            expect(lock.duration).to.eq(ORIGINAL_DURATION_IN_DAYS)

            await vault.connect(bob).extendLock(0, SIX_MONTHS_IN_DAYS)

            lock = await vault.getTokenLock(0)
            expect(lock.duration).to.eq(ORIGINAL_DURATION_IN_DAYS + SIX_MONTHS_IN_DAYS)
        })

        it("does not allow non-receiver to extend a lock", async function() {
            await archToken.approve(vault.address, ethers.constants.MaxUint256)
            let decimals = await archToken.decimals()
            const { timestamp } = await ethers.provider.getBlock('latest')
            const START_TIME = timestamp + 21600
            const ORIGINAL_DURATION_IN_DAYS = 4
            const SIX_MONTHS_IN_DAYS = 6 * 30
            let lockAmount = ethers.BigNumber.from(1000).mul(ethers.BigNumber.from(10).pow(decimals))
            await vault.lockTokens(archToken.address, deployer.address, bob.address, START_TIME, lockAmount, ORIGINAL_DURATION_IN_DAYS, false)
            let lock = await vault.getTokenLock(0)
            expect(lock.duration).to.eq(ORIGINAL_DURATION_IN_DAYS)

            await expect(vault.extendLock(0, SIX_MONTHS_IN_DAYS)).to.revertedWith("Vault::extendLock: msg.sender must be receiver")
            
            lock = await vault.getTokenLock(0)
            expect(lock.duration).to.eq(ORIGINAL_DURATION_IN_DAYS)
        })

        it("does not allow receiver to overflow lock", async function() {
            await archToken.approve(vault.address, ethers.constants.MaxUint256)
            let decimals = await archToken.decimals()
            const { timestamp } = await ethers.provider.getBlock('latest')
            const START_TIME = timestamp + 21600
            const ORIGINAL_DURATION_IN_DAYS = 4
            let lockAmount = ethers.BigNumber.from(1000).mul(ethers.BigNumber.from(10).pow(decimals))
            await vault.lockTokens(archToken.address, deployer.address, bob.address, START_TIME, lockAmount, ORIGINAL_DURATION_IN_DAYS, false)
            let lock = await vault.getTokenLock(0)
            expect(lock.duration).to.eq(ORIGINAL_DURATION_IN_DAYS)

            await expect(vault.connect(bob).extendLock(0, 65535)).to.revertedWith("revert Vault::extendLock: max days exceeded")
            
            lock = await vault.getTokenLock(0)
            expect(lock.duration).to.eq(ORIGINAL_DURATION_IN_DAYS)
        })

    })
})
