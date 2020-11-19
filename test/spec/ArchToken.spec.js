const { expect } = require("chai")
const { ethers } = require("hardhat");
const { tokenFixture } = require("../fixtures")
const { ecsign } = require("ethereumjs-util")

const DEPLOYER_PRIVATE_KEY = process.env.DEPLOYER_PRIVATE_KEY

const DOMAIN_TYPEHASH = ethers.utils.keccak256(
    ethers.utils.toUtf8Bytes('EIP712Domain(string name,string version,uint256 chainId,address verifyingContract)')
)

const PERMIT_TYPEHASH = ethers.utils.keccak256(
    ethers.utils.toUtf8Bytes('Permit(address owner,address spender,uint256 value,uint256 nonce,uint256 deadline)')
)

const TRANSFER_WITH_AUTHORIZATION_TYPEHASH = ethers.utils.keccak256(
  ethers.utils.toUtf8Bytes('TransferWithAuthorization(address from,address to,uint256 value,uint256 validAfter,uint256 validBefore,bytes32 nonce)')
)

const RECEIVE_WITH_AUTHORIZATION_TYPEHASH = ethers.utils.keccak256(
  ethers.utils.toUtf8Bytes('ReceiveWithAuthorization(address from,address to,uint256 value,uint256 validAfter,uint256 validBefore,bytes32 nonce)')
)

describe('ArchToken', () => {
    let archToken
    let deployer
    let admin
    let alice
    let bob
    let ZERO_ADDRESS

    beforeEach(async () => {
      const fix = await tokenFixture()
      archToken = fix.archToken
      deployer = fix.deployer
      admin = fix.admin
      alice = fix.alice
      bob = fix.bob
      ZERO_ADDRESS = fix.ZERO_ADDRESS
    })

    context('transfer', async () => {
      it('allows a valid transfer', async () => {
        const amount = 100
        const balanceBefore = await archToken.balanceOf(alice.address)
        await archToken.transfer(alice.address, amount)
        expect(await archToken.balanceOf(alice.address)).to.eq(balanceBefore.add(amount))
      })

      it('does not allow a transfer to the zero address', async () => {
        const amount = 100
        await expect(archToken.transfer(ZERO_ADDRESS, amount)).to.revertedWith("Arch::_transferTokens: cannot transfer to the zero address")
      })
    })

    context('transferFrom', async () => {
      it('allows a valid transferFrom', async () => {
        const amount = 100
        const senderBalanceBefore = await archToken.balanceOf(deployer.address)
        const receiverBalanceBefore = await archToken.balanceOf(bob.address)
        await archToken.approve(alice.address, amount)
        expect(await archToken.allowance(deployer.address, alice.address)).to.eq(amount)
        await archToken.connect(alice).transferFrom(deployer.address, bob.address, amount)
        expect(await archToken.balanceOf(deployer.address)).to.eq(senderBalanceBefore.sub(amount))
        expect(await archToken.balanceOf(bob.address)).to.eq(receiverBalanceBefore.add(amount))
        expect(await archToken.allowance(deployer.address, alice.address)).to.eq(0)
      })

      it('allows for infinite approvals', async () => {
        const amount = 100
        const maxAmount = ethers.constants.MaxUint256
        await archToken.approve(alice.address, maxAmount)
        expect(await archToken.allowance(deployer.address, alice.address)).to.eq(maxAmount)
        await archToken.connect(alice).transferFrom(deployer.address, bob.address, amount)
        expect(await archToken.allowance(deployer.address, alice.address)).to.eq(maxAmount)
      })

      it('cannot transfer in excess of the spender allowance', async () => {
        await archToken.transfer(alice.address, 100)
        const balance = await archToken.balanceOf(alice.address)
        await expect(archToken.transferFrom(alice.address, bob.address, balance)).to.revertedWith("revert Arch::transferFrom: transfer amount exceeds allowance")
      })
    })
  
    context('transferWithAuthorization', async () => {
      it('allows a valid transfer with auth', async () => {
        const domainSeparator = ethers.utils.keccak256(
          ethers.utils.defaultAbiCoder.encode(
            ['bytes32', 'bytes32', 'bytes32', 'uint256', 'address'],
            [DOMAIN_TYPEHASH, ethers.utils.keccak256(ethers.utils.toUtf8Bytes(await archToken.name())), ethers.utils.keccak256(ethers.utils.toUtf8Bytes("1")), ethers.provider.network.chainId, archToken.address]
          )
        )
    
        const value = 345
        const nonce = ethers.BigNumber.from(ethers.utils.randomBytes(32))
        const validAfter = 0
        const validBefore = ethers.constants.MaxUint256
        const digest = ethers.utils.keccak256(
          ethers.utils.solidityPack(
            ['bytes1', 'bytes1', 'bytes32', 'bytes32'],
            [
              '0x19',
              '0x01',
              domainSeparator,
              ethers.utils.keccak256(
                ethers.utils.defaultAbiCoder.encode(
                  ['bytes32', 'address', 'address', 'uint256', 'uint256', 'uint256', 'uint256'],
                  [TRANSFER_WITH_AUTHORIZATION_TYPEHASH, deployer.address, alice.address, value, validAfter, validBefore, nonce]
                )
              ),
            ]
          )
        )
    
        const { v, r, s } = ecsign(Buffer.from(digest.slice(2), 'hex'), Buffer.from(DEPLOYER_PRIVATE_KEY, 'hex'))
        
        const balanceBefore = await archToken.balanceOf(alice.address)
        await archToken.transferWithAuthorization(deployer.address, alice.address, value, validAfter, validBefore, nonce, v, ethers.utils.hexlify(r), ethers.utils.hexlify(s))
        expect(await archToken.balanceOf(alice.address)).to.eq(balanceBefore.add(value))
      })

      it('does not allow a transfer before auth valid', async () => {
        const domainSeparator = ethers.utils.keccak256(
          ethers.utils.defaultAbiCoder.encode(
            ['bytes32', 'bytes32', 'bytes32', 'uint256', 'address'],
            [DOMAIN_TYPEHASH, ethers.utils.keccak256(ethers.utils.toUtf8Bytes(await archToken.name())), ethers.utils.keccak256(ethers.utils.toUtf8Bytes("1")), ethers.provider.network.chainId, archToken.address]
          )
        )
    
        const value = 345
        const nonce = ethers.BigNumber.from(ethers.utils.randomBytes(32))
        const { timestamp } = await ethers.provider.getBlock('latest')
        const validAfter = timestamp + 1000
        const validBefore = ethers.constants.MaxUint256
        const digest = ethers.utils.keccak256(
          ethers.utils.solidityPack(
            ['bytes1', 'bytes1', 'bytes32', 'bytes32'],
            [
              '0x19',
              '0x01',
              domainSeparator,
              ethers.utils.keccak256(
                ethers.utils.defaultAbiCoder.encode(
                  ['bytes32', 'address', 'address', 'uint256', 'uint256', 'uint256', 'uint256'],
                  [TRANSFER_WITH_AUTHORIZATION_TYPEHASH, deployer.address, alice.address, value, validAfter, validBefore, nonce]
                )
              ),
            ]
          )
        )
    
        const { v, r, s } = ecsign(Buffer.from(digest.slice(2), 'hex'), Buffer.from(DEPLOYER_PRIVATE_KEY, 'hex'))
        
        await expect(archToken.transferWithAuthorization(deployer.address, alice.address, value, validAfter, validBefore, nonce, v, ethers.utils.hexlify(r), ethers.utils.hexlify(s))).to.revertedWith("revert Arch::transferWithAuth: auth not yet valid")
      })

      it('does not allow a transfer after auth expiration', async () => {
        const domainSeparator = ethers.utils.keccak256(
          ethers.utils.defaultAbiCoder.encode(
            ['bytes32', 'bytes32', 'bytes32', 'uint256', 'address'],
            [DOMAIN_TYPEHASH, ethers.utils.keccak256(ethers.utils.toUtf8Bytes(await archToken.name())), ethers.utils.keccak256(ethers.utils.toUtf8Bytes("1")), ethers.provider.network.chainId, archToken.address]
          )
        )
    
        const value = 345
        const nonce = ethers.BigNumber.from(ethers.utils.randomBytes(32))
        const validAfter = 0
        const validBefore = 0
        const digest = ethers.utils.keccak256(
          ethers.utils.solidityPack(
            ['bytes1', 'bytes1', 'bytes32', 'bytes32'],
            [
              '0x19',
              '0x01',
              domainSeparator,
              ethers.utils.keccak256(
                ethers.utils.defaultAbiCoder.encode(
                  ['bytes32', 'address', 'address', 'uint256', 'uint256', 'uint256', 'uint256'],
                  [TRANSFER_WITH_AUTHORIZATION_TYPEHASH, deployer.address, alice.address, value, validAfter, validBefore, nonce]
                )
              ),
            ]
          )
        )
    
        const { v, r, s } = ecsign(Buffer.from(digest.slice(2), 'hex'), Buffer.from(DEPLOYER_PRIVATE_KEY, 'hex'))
        
        await expect(archToken.transferWithAuthorization(deployer.address, alice.address, value, validAfter, validBefore, nonce, v, ethers.utils.hexlify(r), ethers.utils.hexlify(s))).to.revertedWith("revert Arch::transferWithAuth: auth expired")
      })

      it('does not allow a reuse of nonce', async () => {
        const domainSeparator = ethers.utils.keccak256(
          ethers.utils.defaultAbiCoder.encode(
            ['bytes32', 'bytes32', 'bytes32', 'uint256', 'address'],
            [DOMAIN_TYPEHASH, ethers.utils.keccak256(ethers.utils.toUtf8Bytes(await archToken.name())), ethers.utils.keccak256(ethers.utils.toUtf8Bytes("1")), ethers.provider.network.chainId, archToken.address]
          )
        )
    
        const value = 345
        const nonce = ethers.BigNumber.from(ethers.utils.randomBytes(32))
        const validAfter = 0
        const validBefore = ethers.constants.MaxUint256
        let digest = ethers.utils.keccak256(
          ethers.utils.solidityPack(
            ['bytes1', 'bytes1', 'bytes32', 'bytes32'],
            [
              '0x19',
              '0x01',
              domainSeparator,
              ethers.utils.keccak256(
                ethers.utils.defaultAbiCoder.encode(
                  ['bytes32', 'address', 'address', 'uint256', 'uint256', 'uint256', 'uint256'],
                  [TRANSFER_WITH_AUTHORIZATION_TYPEHASH, deployer.address, alice.address, value, validAfter, validBefore, nonce]
                )
              ),
            ]
          )
        )
    
        let { v, r, s } = ecsign(Buffer.from(digest.slice(2), 'hex'), Buffer.from(DEPLOYER_PRIVATE_KEY, 'hex'))
        
        const balanceBefore = await archToken.balanceOf(alice.address)
        await archToken.transferWithAuthorization(deployer.address, alice.address, value, validAfter, validBefore, nonce, v, ethers.utils.hexlify(r), ethers.utils.hexlify(s))
        expect(await archToken.balanceOf(alice.address)).to.eq(balanceBefore.add(value))

        digest = ethers.utils.keccak256(
          ethers.utils.solidityPack(
            ['bytes1', 'bytes1', 'bytes32', 'bytes32'],
            [
              '0x19',
              '0x01',
              domainSeparator,
              ethers.utils.keccak256(
                ethers.utils.defaultAbiCoder.encode(
                  ['bytes32', 'address', 'address', 'uint256', 'uint256', 'uint256', 'uint256'],
                  [TRANSFER_WITH_AUTHORIZATION_TYPEHASH, deployer.address, bob.address, value, validAfter, validBefore, nonce]
                )
              ),
            ]
          )
        )
    
        let sig = ecsign(Buffer.from(digest.slice(2), 'hex'), Buffer.from(DEPLOYER_PRIVATE_KEY, 'hex'))

        await expect(archToken.transferWithAuthorization(deployer.address, bob.address, value, validAfter, validBefore, nonce, sig.v, ethers.utils.hexlify(sig.r), ethers.utils.hexlify(sig.s))).to.revertedWith("revert Arch::transferWithAuth: auth already used")
      })
    })

    context('receiveWithAuthorization', async () => {
      it('allows a valid receive with auth', async () => {
        const domainSeparator = ethers.utils.keccak256(
          ethers.utils.defaultAbiCoder.encode(
            ['bytes32', 'bytes32', 'bytes32', 'uint256', 'address'],
            [DOMAIN_TYPEHASH, ethers.utils.keccak256(ethers.utils.toUtf8Bytes(await archToken.name())), ethers.utils.keccak256(ethers.utils.toUtf8Bytes("1")), ethers.provider.network.chainId, archToken.address]
          )
        )
    
        const value = 345
        const nonce = ethers.BigNumber.from(ethers.utils.randomBytes(32))
        const validAfter = 0
        const validBefore = ethers.constants.MaxUint256
        const digest = ethers.utils.keccak256(
          ethers.utils.solidityPack(
            ['bytes1', 'bytes1', 'bytes32', 'bytes32'],
            [
              '0x19',
              '0x01',
              domainSeparator,
              ethers.utils.keccak256(
                ethers.utils.defaultAbiCoder.encode(
                  ['bytes32', 'address', 'address', 'uint256', 'uint256', 'uint256', 'uint256'],
                  [RECEIVE_WITH_AUTHORIZATION_TYPEHASH, deployer.address, alice.address, value, validAfter, validBefore, nonce]
                )
              ),
            ]
          )
        )
    
        const { v, r, s } = ecsign(Buffer.from(digest.slice(2), 'hex'), Buffer.from(DEPLOYER_PRIVATE_KEY, 'hex'))
        
        const balanceBefore = await archToken.balanceOf(alice.address)
        await archToken.connect(alice).receiveWithAuthorization(deployer.address, alice.address, value, validAfter, validBefore, nonce, v, ethers.utils.hexlify(r), ethers.utils.hexlify(s))
        expect(await archToken.balanceOf(alice.address)).to.eq(balanceBefore.add(value))
      })

      it('does not allow a user to initiate a transfer intended for another user', async () => {
        const domainSeparator = ethers.utils.keccak256(
          ethers.utils.defaultAbiCoder.encode(
            ['bytes32', 'bytes32', 'bytes32', 'uint256', 'address'],
            [DOMAIN_TYPEHASH, ethers.utils.keccak256(ethers.utils.toUtf8Bytes(await archToken.name())), ethers.utils.keccak256(ethers.utils.toUtf8Bytes("1")), ethers.provider.network.chainId, archToken.address]
          )
        )
    
        const value = 345
        const nonce = ethers.BigNumber.from(ethers.utils.randomBytes(32))
        const validAfter = 0
        const validBefore = ethers.constants.MaxUint256
        const digest = ethers.utils.keccak256(
          ethers.utils.solidityPack(
            ['bytes1', 'bytes1', 'bytes32', 'bytes32'],
            [
              '0x19',
              '0x01',
              domainSeparator,
              ethers.utils.keccak256(
                ethers.utils.defaultAbiCoder.encode(
                  ['bytes32', 'address', 'address', 'uint256', 'uint256', 'uint256', 'uint256'],
                  [RECEIVE_WITH_AUTHORIZATION_TYPEHASH, deployer.address, alice.address, value, validAfter, validBefore, nonce]
                )
              ),
            ]
          )
        )
    
        const { v, r, s } = ecsign(Buffer.from(digest.slice(2), 'hex'), Buffer.from(DEPLOYER_PRIVATE_KEY, 'hex'))
        
        await expect(archToken.connect(bob).receiveWithAuthorization(deployer.address, alice.address, value, validAfter, validBefore, nonce, v, ethers.utils.hexlify(r), ethers.utils.hexlify(s))).to.revertedWith("revert Arch::receiveWithAuth: caller must be the payee")
      })

      it('does not allow a receive before auth valid', async () => {
        const domainSeparator = ethers.utils.keccak256(
          ethers.utils.defaultAbiCoder.encode(
            ['bytes32', 'bytes32', 'bytes32', 'uint256', 'address'],
            [DOMAIN_TYPEHASH, ethers.utils.keccak256(ethers.utils.toUtf8Bytes(await archToken.name())), ethers.utils.keccak256(ethers.utils.toUtf8Bytes("1")), ethers.provider.network.chainId, archToken.address]
          )
        )
    
        const value = 345
        const nonce = ethers.BigNumber.from(ethers.utils.randomBytes(32))
        const { timestamp } = await ethers.provider.getBlock('latest')
        const validAfter = timestamp + 1000
        const validBefore = ethers.constants.MaxUint256
        const digest = ethers.utils.keccak256(
          ethers.utils.solidityPack(
            ['bytes1', 'bytes1', 'bytes32', 'bytes32'],
            [
              '0x19',
              '0x01',
              domainSeparator,
              ethers.utils.keccak256(
                ethers.utils.defaultAbiCoder.encode(
                  ['bytes32', 'address', 'address', 'uint256', 'uint256', 'uint256', 'uint256'],
                  [RECEIVE_WITH_AUTHORIZATION_TYPEHASH, deployer.address, alice.address, value, validAfter, validBefore, nonce]
                )
              ),
            ]
          )
        )
    
        const { v, r, s } = ecsign(Buffer.from(digest.slice(2), 'hex'), Buffer.from(DEPLOYER_PRIVATE_KEY, 'hex'))
        
        await expect(archToken.connect(alice).receiveWithAuthorization(deployer.address, alice.address, value, validAfter, validBefore, nonce, v, ethers.utils.hexlify(r), ethers.utils.hexlify(s))).to.revertedWith("revert Arch::receiveWithAuth: auth not yet valid")
      })

      it('does not allow a receive after auth expiration', async () => {
        const domainSeparator = ethers.utils.keccak256(
          ethers.utils.defaultAbiCoder.encode(
            ['bytes32', 'bytes32', 'bytes32', 'uint256', 'address'],
            [DOMAIN_TYPEHASH, ethers.utils.keccak256(ethers.utils.toUtf8Bytes(await archToken.name())), ethers.utils.keccak256(ethers.utils.toUtf8Bytes("1")), ethers.provider.network.chainId, archToken.address]
          )
        )
    
        const value = 345
        const nonce = ethers.BigNumber.from(ethers.utils.randomBytes(32))
        const validAfter = 0
        const validBefore = 0
        const digest = ethers.utils.keccak256(
          ethers.utils.solidityPack(
            ['bytes1', 'bytes1', 'bytes32', 'bytes32'],
            [
              '0x19',
              '0x01',
              domainSeparator,
              ethers.utils.keccak256(
                ethers.utils.defaultAbiCoder.encode(
                  ['bytes32', 'address', 'address', 'uint256', 'uint256', 'uint256', 'uint256'],
                  [RECEIVE_WITH_AUTHORIZATION_TYPEHASH, deployer.address, alice.address, value, validAfter, validBefore, nonce]
                )
              ),
            ]
          )
        )
    
        const { v, r, s } = ecsign(Buffer.from(digest.slice(2), 'hex'), Buffer.from(DEPLOYER_PRIVATE_KEY, 'hex'))
        
        await expect(archToken.connect(alice).receiveWithAuthorization(deployer.address, alice.address, value, validAfter, validBefore, nonce, v, ethers.utils.hexlify(r), ethers.utils.hexlify(s))).to.revertedWith("revert Arch::receiveWithAuth: auth expired")
      })

      it('does not allow a reuse of nonce', async () => {
        const domainSeparator = ethers.utils.keccak256(
          ethers.utils.defaultAbiCoder.encode(
            ['bytes32', 'bytes32', 'bytes32', 'uint256', 'address'],
            [DOMAIN_TYPEHASH, ethers.utils.keccak256(ethers.utils.toUtf8Bytes(await archToken.name())), ethers.utils.keccak256(ethers.utils.toUtf8Bytes("1")), ethers.provider.network.chainId, archToken.address]
          )
        )
    
        const value = 345
        const nonce = ethers.BigNumber.from(ethers.utils.randomBytes(32))
        const validAfter = 0
        const validBefore = ethers.constants.MaxUint256
        let digest = ethers.utils.keccak256(
          ethers.utils.solidityPack(
            ['bytes1', 'bytes1', 'bytes32', 'bytes32'],
            [
              '0x19',
              '0x01',
              domainSeparator,
              ethers.utils.keccak256(
                ethers.utils.defaultAbiCoder.encode(
                  ['bytes32', 'address', 'address', 'uint256', 'uint256', 'uint256', 'uint256'],
                  [RECEIVE_WITH_AUTHORIZATION_TYPEHASH, deployer.address, alice.address, value, validAfter, validBefore, nonce]
                )
              ),
            ]
          )
        )
    
        let { v, r, s } = ecsign(Buffer.from(digest.slice(2), 'hex'), Buffer.from(DEPLOYER_PRIVATE_KEY, 'hex'))
        
        const balanceBefore = await archToken.balanceOf(alice.address)
        await archToken.connect(alice).receiveWithAuthorization(deployer.address, alice.address, value, validAfter, validBefore, nonce, v, ethers.utils.hexlify(r), ethers.utils.hexlify(s))
        expect(await archToken.balanceOf(alice.address)).to.eq(balanceBefore.add(value))

        digest = ethers.utils.keccak256(
          ethers.utils.solidityPack(
            ['bytes1', 'bytes1', 'bytes32', 'bytes32'],
            [
              '0x19',
              '0x01',
              domainSeparator,
              ethers.utils.keccak256(
                ethers.utils.defaultAbiCoder.encode(
                  ['bytes32', 'address', 'address', 'uint256', 'uint256', 'uint256', 'uint256'],
                  [RECEIVE_WITH_AUTHORIZATION_TYPEHASH, deployer.address, bob.address, value, validAfter, validBefore, nonce]
                )
              ),
            ]
          )
        )
    
        let sig = ecsign(Buffer.from(digest.slice(2), 'hex'), Buffer.from(DEPLOYER_PRIVATE_KEY, 'hex'))

        await expect(archToken.connect(bob).receiveWithAuthorization(deployer.address, bob.address, value, validAfter, validBefore, nonce, sig.v, ethers.utils.hexlify(sig.r), ethers.utils.hexlify(sig.s))).to.revertedWith("revert Arch::receiveWithAuth: auth already used")
      })
    })
    
    context('permit', async () => {
      it('allows a valid permit', async () => {
        const domainSeparator = ethers.utils.keccak256(
          ethers.utils.defaultAbiCoder.encode(
            ['bytes32', 'bytes32', 'bytes32', 'uint256', 'address'],
            [DOMAIN_TYPEHASH, ethers.utils.keccak256(ethers.utils.toUtf8Bytes(await archToken.name())), ethers.utils.keccak256(ethers.utils.toUtf8Bytes("1")), ethers.provider.network.chainId, archToken.address]
          )
        )

        const value = 123
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
                  [PERMIT_TYPEHASH, deployer.address, alice.address, value, nonce, deadline]
                )
              ),
            ]
          )
        )

        const { v, r, s } = ecsign(Buffer.from(digest.slice(2), 'hex'), Buffer.from(DEPLOYER_PRIVATE_KEY, 'hex'))
        
        await archToken.permit(deployer.address, alice.address, value, deadline, v, ethers.utils.hexlify(r), ethers.utils.hexlify(s))
        expect(await archToken.allowance(deployer.address, alice.address)).to.eq(value)
        expect(await archToken.nonces(deployer.address)).to.eq(1)

        await archToken.connect(alice).transferFrom(deployer.address, bob.address, value)
      })

      it('does not allow a permit after deadline', async () => {
        const domainSeparator = ethers.utils.keccak256(
          ethers.utils.defaultAbiCoder.encode(
            ['bytes32', 'bytes32', 'bytes32', 'uint256', 'address'],
            [DOMAIN_TYPEHASH, ethers.utils.keccak256(ethers.utils.toUtf8Bytes(await archToken.name())), ethers.utils.keccak256(ethers.utils.toUtf8Bytes("1")), ethers.provider.network.chainId, archToken.address]
          )
        )

        const value = 123
        const nonce = await archToken.nonces(deployer.address)
        const deadline = 0
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
                  [PERMIT_TYPEHASH, deployer.address, alice.address, value, nonce, deadline]
                )
              ),
            ]
          )
        )

        const { v, r, s } = ecsign(Buffer.from(digest.slice(2), 'hex'), Buffer.from(DEPLOYER_PRIVATE_KEY, 'hex'))
        
        await expect(archToken.permit(deployer.address, alice.address, value, deadline, v, ethers.utils.hexlify(r), ethers.utils.hexlify(s))).to.revertedWith("revert Arch::permit: signature expired")
      })
    })

    context("mint", async () => {
      it('can perform a valid mint', async () => {
        const totalSupplyBefore = await archToken.totalSupply()
        const mintCap = await archToken.mintCap()
        const maxAmount = totalSupplyBefore.mul(mintCap).div(1000000)
        const supplyChangeAllowed = await archToken.supplyChangeAllowedAfter()
        await ethers.provider.send("evm_setNextBlockTimestamp", [parseInt(supplyChangeAllowed.toString())])
        const balanceBefore = await archToken.balanceOf(alice.address)
        await archToken.mint(alice.address, maxAmount)
        expect(await archToken.balanceOf(alice.address)).to.equal(balanceBefore.add(maxAmount))
        expect(await archToken.totalSupply()).to.equal(totalSupplyBefore.add(maxAmount))
      })

      it('only supply manager can mint', async () => {
        await expect(archToken.connect(alice).mint(bob.address, 1)).to.revertedWith("revert Arch::mint: only the supplyManager can mint")
      })

      it('cannot mint to the zero address', async () => {
        await expect(archToken.mint(ZERO_ADDRESS, 1)).to.revertedWith("revert Arch::mint: cannot transfer to the zero address")
      })

      it('cannot mint in excess of the mint cap', async () => {
        const totalSupply = await archToken.totalSupply()
        const mintCap = await archToken.mintCap()
        const maxAmount = totalSupply.mul(mintCap).div(1000000)
        await expect(archToken.mint(alice.address, maxAmount.add(1))).to.revertedWith("revert Arch::mint: exceeded mint cap")
      })

      it('cannot mint before supply change allowed', async () => {
        await expect(archToken.mint(alice.address, 1)).to.revertedWith("revert Arch::mint: minting not allowed yet")
      })
    })
  
    context("burn", async () => {
      it('can perform a valid burn', async () => {
        const amount = 100
        const totalSupplyBefore = await archToken.totalSupply()
        await archToken.transfer(alice.address, amount)
        const balanceBefore = await archToken.balanceOf(alice.address)
        await archToken.connect(alice).approve(deployer.address, amount)
        const allowanceBefore = await archToken.allowance(alice.address, deployer.address)
        const supplyChangeAllowed = await archToken.supplyChangeAllowedAfter()
        await ethers.provider.send("evm_setNextBlockTimestamp", [parseInt(supplyChangeAllowed.toString())])
        await archToken.burn(alice.address, amount)
        expect(await archToken.balanceOf(alice.address)).to.equal(balanceBefore.sub(amount))
        expect(await archToken.allowance(alice.address, deployer.address)).to.equal(allowanceBefore.sub(amount))
        expect(await archToken.totalSupply()).to.equal(totalSupplyBefore.sub(amount))
      })

      it('only supply manager can burn', async () => {
        await expect(archToken.connect(alice).burn(deployer.address, 1)).to.revertedWith("revert Arch::burn: only the supplyManager can burn")
      })

      it('cannot burn from the zero address', async () => {
        await expect(archToken.burn(ZERO_ADDRESS, 1)).to.revertedWith("revert Arch::burn: cannot transfer from the zero address")
      })

      it('cannot burn before supply change allowed', async () => {
        await expect(archToken.burn(deployer.address, 1)).to.revertedWith("revert Arch::burn: burning not allowed yet")
      })

      it('cannot burn in excess of the spender balance', async () => {
        const supplyChangeAllowed = await archToken.supplyChangeAllowedAfter()
        await ethers.provider.send("evm_setNextBlockTimestamp", [parseInt(supplyChangeAllowed.toString())])
        const balance = await archToken.balanceOf(alice.address)
        await archToken.connect(alice).approve(deployer.address, balance)
        await expect(archToken.burn(alice.address, balance.add(1))).to.revertedWith("revert Arch::burn: burn amount exceeds allowance")
      })

      it('cannot burn in excess of the spender allowance', async () => {
        const supplyChangeAllowed = await archToken.supplyChangeAllowedAfter()
        await ethers.provider.send("evm_setNextBlockTimestamp", [parseInt(supplyChangeAllowed.toString())])
        await archToken.transfer(alice.address, 100)
        const balance = await archToken.balanceOf(alice.address)
        await expect(archToken.burn(alice.address, balance)).to.revertedWith("revert Arch::burn: burn amount exceeds allowance")
      })
    })

    context("setSupplyManager", async () => {
      it('can set a new valid supply manager', async () => {
        await archToken.setSupplyManager(bob.address)
        expect(await archToken.supplyManager()).to.equal(bob.address)
      })

      it('only supply manager can set a new supply manager', async () => {
        await expect(archToken.connect(alice).setSupplyManager(bob.address)).to.revertedWith("revert Arch::setSupplyManager: only SM can change SM")
      })
    })

    context("setMetadataManager", async () => {
      it('can set a new valid metadata manager', async () => {
        await archToken.connect(admin).setMetadataManager(bob.address)
        expect(await archToken.metadataManager()).to.equal(bob.address)
      })

      it('only metadata manager can set a new metadata manager', async () => {
        await expect(archToken.connect(alice).setMetadataManager(bob.address)).to.revertedWith("revert Arch::setMetadataManager: only MM can change MM")
      })
    })

    context("setMintCap", async () => {
      it('can set a new valid mint cap', async () => {
        await archToken.setMintCap(0)
        expect(await archToken.mintCap()).to.equal(0)
      })

      it('only supply manager can set a new mint cap', async () => {
        await expect(archToken.connect(alice).setMintCap(0)).to.revertedWith("revert Arch::setMintCap: only SM can change mint cap")
      })
    })

    context("setSupplyChangeWaitingPeriod", async () => {
      it('can set a new valid supply change waiting period', async () => {
        const waitingPeriodMinimum = await archToken.supplyChangeWaitingPeriodMinimum()
        await archToken.setSupplyChangeWaitingPeriod(waitingPeriodMinimum)
        expect(await archToken.supplyChangeWaitingPeriod()).to.equal(waitingPeriodMinimum)
      })

      it('only supply manager can set a new supply change waiting period', async () => {
        const waitingPeriodMinimum = await archToken.supplyChangeWaitingPeriodMinimum()
        await expect(archToken.connect(alice).setSupplyChangeWaitingPeriod(waitingPeriodMinimum)).to.revertedWith("revert Arch::setSupplyChangeWaitingPeriod: only SM can change waiting period")
      })

      it('waiting period must be > minimum', async () => {
        await expect(archToken.setSupplyChangeWaitingPeriod(0)).to.revertedWith("revert Arch::setSupplyChangeWaitingPeriod: waiting period must be > minimum")
      })
    })

    context("updateTokenMetadata", async () => {
      it('metadata manager can update token metadata', async () => {
        await archToken.connect(admin).updateTokenMetadata("New Token", "NEW")
        expect(await archToken.name()).to.equal("New Token")
        expect(await archToken.symbol()).to.equal("NEW")
      })

      it('only metadata manager can update token metadata', async () => {
        await expect(archToken.connect(alice).updateTokenMetadata("New Token", "NEW")).to.revertedWith("revert Arch::updateTokenMeta: only MM can update token metadata")
      })
    })
  })