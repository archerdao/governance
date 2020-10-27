const { expect } = require("chai")
const { ethers } = require("hardhat");
const { governanceFixture } = require("./fixtures")
const { ecsign } = require("ethereumjs-util")
const ADMIN_PRIVATE_KEY = process.env.ADMIN_PRIVATE_KEY

const DOMAIN_TYPEHASH = ethers.utils.keccak256(
    ethers.utils.toUtf8Bytes('EIP712Domain(string name,string version,uint256 chainId,address verifyingContract)')
)

const PERMIT_TYPEHASH = ethers.utils.keccak256(
    ethers.utils.toUtf8Bytes('Permit(address owner,address spender,uint256 value,uint256 nonce,uint256 deadline)')
)

const TRANSFER_WITH_AUTHORIZATION_TYPEHASH = ethers.utils.keccak256(
  ethers.utils.toUtf8Bytes('TransferWithAuthorization(address from,address to,uint256 value,uint256 validAfter,uint256 validBefore,bytes32 nonce)')
)

const ZERO_ADDRESS = "0x0000000000000000000000000000000000000000"

describe('ArchToken', () => {
    let archToken
    let tokenName = "Archer"
    let deployer
    let admin
    let alice
    let bob
    let carlos

    beforeEach(async () => {
      const gov = await governanceFixture()
      archToken = gov.archToken
      deployer = gov.deployer
      admin = gov.admin
      alice = gov.alice
      bob = gov.bob
      carlos = gov.carlos
    })
  
    context('transferWithAuthorization', async () => {
      it('allows a valid transfer with auth', async () => {
        const domainSeparator = ethers.utils.keccak256(
          ethers.utils.defaultAbiCoder.encode(
            ['bytes32', 'bytes32', 'bytes32', 'uint256', 'address'],
            [DOMAIN_TYPEHASH, ethers.utils.keccak256(ethers.utils.toUtf8Bytes(tokenName)), ethers.utils.keccak256(ethers.utils.toUtf8Bytes("1")), ethers.provider.network.chainId, archToken.address]
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
                  [TRANSFER_WITH_AUTHORIZATION_TYPEHASH, admin.address, alice.address, value, validAfter, validBefore, nonce]
                )
              ),
            ]
          )
        )
    
        const { v, r, s } = ecsign(Buffer.from(digest.slice(2), 'hex'), Buffer.from(ADMIN_PRIVATE_KEY.slice(2), 'hex'))
        
        const balanceBefore = await archToken.balanceOf(alice.address)
        await archToken.transferWithAuthorization(admin.address, alice.address, value, validAfter, validBefore, nonce, v, ethers.utils.hexlify(r), ethers.utils.hexlify(s))
        expect(await archToken.balanceOf(alice.address)).to.eq(balanceBefore.add(value))
      })

      it('does not allow a transfer before auth valid', async () => {
        const domainSeparator = ethers.utils.keccak256(
          ethers.utils.defaultAbiCoder.encode(
            ['bytes32', 'bytes32', 'bytes32', 'uint256', 'address'],
            [DOMAIN_TYPEHASH, ethers.utils.keccak256(ethers.utils.toUtf8Bytes(tokenName)), ethers.utils.keccak256(ethers.utils.toUtf8Bytes("1")), ethers.provider.network.chainId, archToken.address]
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
                  [TRANSFER_WITH_AUTHORIZATION_TYPEHASH, admin.address, alice.address, value, validAfter, validBefore, nonce]
                )
              ),
            ]
          )
        )
    
        const { v, r, s } = ecsign(Buffer.from(digest.slice(2), 'hex'), Buffer.from(ADMIN_PRIVATE_KEY.slice(2), 'hex'))
        
        await expect(archToken.transferWithAuthorization(admin.address, alice.address, value, validAfter, validBefore, nonce, v, ethers.utils.hexlify(r), ethers.utils.hexlify(s))).to.revertedWith("revert Arch::transferWithAuth: auth not yet valid")
      })

      it('does not allow a transfer after auth expiration', async () => {
        const domainSeparator = ethers.utils.keccak256(
          ethers.utils.defaultAbiCoder.encode(
            ['bytes32', 'bytes32', 'bytes32', 'uint256', 'address'],
            [DOMAIN_TYPEHASH, ethers.utils.keccak256(ethers.utils.toUtf8Bytes(tokenName)), ethers.utils.keccak256(ethers.utils.toUtf8Bytes("1")), ethers.provider.network.chainId, archToken.address]
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
                  [TRANSFER_WITH_AUTHORIZATION_TYPEHASH, admin.address, alice.address, value, validAfter, validBefore, nonce]
                )
              ),
            ]
          )
        )
    
        const { v, r, s } = ecsign(Buffer.from(digest.slice(2), 'hex'), Buffer.from(ADMIN_PRIVATE_KEY.slice(2), 'hex'))
        
        await expect(archToken.transferWithAuthorization(admin.address, alice.address, value, validAfter, validBefore, nonce, v, ethers.utils.hexlify(r), ethers.utils.hexlify(s))).to.revertedWith("revert Arch::transferWithAuth: auth expired")
      })

      it('does not allow a reuse of nonce', async () => {
        const domainSeparator = ethers.utils.keccak256(
          ethers.utils.defaultAbiCoder.encode(
            ['bytes32', 'bytes32', 'bytes32', 'uint256', 'address'],
            [DOMAIN_TYPEHASH, ethers.utils.keccak256(ethers.utils.toUtf8Bytes(tokenName)), ethers.utils.keccak256(ethers.utils.toUtf8Bytes("1")), ethers.provider.network.chainId, archToken.address]
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
                  [TRANSFER_WITH_AUTHORIZATION_TYPEHASH, admin.address, alice.address, value, validAfter, validBefore, nonce]
                )
              ),
            ]
          )
        )
    
        let { v, r, s } = ecsign(Buffer.from(digest.slice(2), 'hex'), Buffer.from(ADMIN_PRIVATE_KEY.slice(2), 'hex'))
        
        const balanceBefore = await archToken.balanceOf(alice.address)
        await archToken.transferWithAuthorization(admin.address, alice.address, value, validAfter, validBefore, nonce, v, ethers.utils.hexlify(r), ethers.utils.hexlify(s))
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
                  [TRANSFER_WITH_AUTHORIZATION_TYPEHASH, admin.address, bob.address, value, validAfter, validBefore, nonce]
                )
              ),
            ]
          )
        )
    
        let sig = ecsign(Buffer.from(digest.slice(2), 'hex'), Buffer.from(ADMIN_PRIVATE_KEY.slice(2), 'hex'))

        await expect(archToken.transferWithAuthorization(admin.address, bob.address, value, validAfter, validBefore, nonce, sig.v, ethers.utils.hexlify(sig.r), ethers.utils.hexlify(sig.s))).to.revertedWith("revert Arch::transferWithAuth: auth already used")
      })
    })
    
    context('permit', async () => {
      it('allows a valid permit', async () => {
        const domainSeparator = ethers.utils.keccak256(
          ethers.utils.defaultAbiCoder.encode(
            ['bytes32', 'bytes32', 'bytes32', 'uint256', 'address'],
            [DOMAIN_TYPEHASH, ethers.utils.keccak256(ethers.utils.toUtf8Bytes(tokenName)), ethers.utils.keccak256(ethers.utils.toUtf8Bytes("1")), ethers.provider.network.chainId, archToken.address]
          )
        )

        const value = 123
        const nonce = await archToken.nonces(admin.address)
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
                  [PERMIT_TYPEHASH, admin.address, alice.address, value, nonce, deadline]
                )
              ),
            ]
          )
        )

        const { v, r, s } = ecsign(Buffer.from(digest.slice(2), 'hex'), Buffer.from(ADMIN_PRIVATE_KEY.slice(2), 'hex'))
        
        await archToken.permit(admin.address, alice.address, value, deadline, v, ethers.utils.hexlify(r), ethers.utils.hexlify(s))
        expect(await archToken.allowance(admin.address, alice.address)).to.eq(value)
        expect(await archToken.nonces(admin.address)).to.eq(1)

        await archToken.connect(alice).transferFrom(admin.address, bob.address, value)
      })

      it('does not allow a permit after deadline', async () => {
        const domainSeparator = ethers.utils.keccak256(
          ethers.utils.defaultAbiCoder.encode(
            ['bytes32', 'bytes32', 'bytes32', 'uint256', 'address'],
            [DOMAIN_TYPEHASH, ethers.utils.keccak256(ethers.utils.toUtf8Bytes(tokenName)), ethers.utils.keccak256(ethers.utils.toUtf8Bytes("1")), ethers.provider.network.chainId, archToken.address]
          )
        )

        const value = 123
        const nonce = await archToken.nonces(admin.address)
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
                  [PERMIT_TYPEHASH, admin.address, alice.address, value, nonce, deadline]
                )
              ),
            ]
          )
        )

        const { v, r, s } = ecsign(Buffer.from(digest.slice(2), 'hex'), Buffer.from(ADMIN_PRIVATE_KEY.slice(2), 'hex'))
        
        await expect(archToken.permit(admin.address, alice.address, value, deadline, v, ethers.utils.hexlify(r), ethers.utils.hexlify(s))).to.revertedWith("revert Arch::permit: signature expired")
      })
    })

    context("mint", async () => {
      it('can perform a valid mint', async () => {
        const totalSupply = await archToken.totalSupply()
        const mintCap = await archToken.mintCap()
        const maxAmount = totalSupply.mul(mintCap).div(1000000)
        const supplyChangeAllowed = await archToken.supplyChangeAllowedAfter()
        await ethers.provider.send("evm_setNextBlockTimestamp", [parseInt(supplyChangeAllowed.toString())])
        const balanceBefore = await archToken.balanceOf(alice.address)
        await archToken.mint(alice.address, maxAmount)
        expect(await archToken.balanceOf(alice.address)).to.equal(balanceBefore.add(maxAmount))
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
        await archToken.connect(admin).transfer(alice.address, amount)
        const balanceBefore = await archToken.balanceOf(alice.address)
        await archToken.connect(alice).approve(deployer.address, amount)
        const allowanceBefore = await archToken.allowance(alice.address, deployer.address)
        const supplyChangeAllowed = await archToken.supplyChangeAllowedAfter()
        await ethers.provider.send("evm_setNextBlockTimestamp", [parseInt(supplyChangeAllowed.toString())])
        await archToken.connect(deployer).burn(alice.address, amount)
        expect(await archToken.balanceOf(alice.address)).to.equal(balanceBefore.sub(amount))
        expect(await archToken.allowance(alice.address, deployer.address)).to.equal(allowanceBefore.sub(amount))
        expect(await archToken.totalSupply()).to.equal(totalSupplyBefore.sub(amount))
      })
      it('only supply manager can burn', async () => {
        await expect(archToken.connect(alice).burn(admin.address, 1)).to.revertedWith("revert Arch::burn: only the supplyManager can burn")
      })

      it('cannot burn from the zero address', async () => {
        await expect(archToken.burn(ZERO_ADDRESS, 1)).to.revertedWith("revert Arch::burn: cannot transfer from the zero address")
      })
      it('cannot burn before supply change allowed', async () => {
        await expect(archToken.burn(admin.address, 1)).to.revertedWith("revert Arch::burn: burning not allowed yet")
      })
      it('cannot burn in excess of the spender balance', async () => {
        const supplyChangeAllowed = await archToken.supplyChangeAllowedAfter()
        await ethers.provider.send("evm_setNextBlockTimestamp", [parseInt(supplyChangeAllowed.toString())])
        const balance = await archToken.balanceOf(alice.address)
        await expect(archToken.burn(alice.address, balance.add(1))).to.revertedWith("revert SafeMath: subtraction underflow")
      })

      it('cannot burn in excess of the spender allowance', async () => {
        const supplyChangeAllowed = await archToken.supplyChangeAllowedAfter()
        await ethers.provider.send("evm_setNextBlockTimestamp", [parseInt(supplyChangeAllowed.toString())])
        await archToken.connect(admin).transfer(alice.address, 100)
        const balance = await archToken.balanceOf(alice.address)
        await expect(archToken.burn(alice.address, balance)).to.revertedWith("revert SafeMath: subtraction underflow")
      })
    })
  })