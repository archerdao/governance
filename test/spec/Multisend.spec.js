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

describe('Multisend', () => {
    let archToken
    let multisend
    let deployer
    let alice
    let bob

    beforeEach(async () => {
      const fix = await tokenFixture()
      archToken = fix.archToken
      multisend = fix.multisend
      deployer = fix.deployer
      alice = fix.alice
      bob = fix.bob
    })
  
    context('batchTransfer', async () => {
      it('allows a single valid transfer in batch', async () => {
        const amount = 100
        const senderBalanceBefore = await archToken.balanceOf(deployer.address)
        const receiverBalanceBefore = await archToken.balanceOf(bob.address)
        await archToken.approve(multisend.address, amount)
        expect(await archToken.allowance(deployer.address, multisend.address)).to.eq(amount)
        await multisend.batchTransfer(amount, [alice.address], [amount])
        expect(await archToken.balanceOf(deployer.address)).to.eq(senderBalanceBefore.sub(amount))
        expect(await archToken.balanceOf(alice.address)).to.eq(receiverBalanceBefore.add(amount))
        expect(await archToken.allowance(deployer.address, multisend.address)).to.eq(0)
      })

      it('allows multiple valid transfers in batch', async () => {
        const amountPerTransfer = 100
        const numTransfers = 2
        const totalAmount = amountPerTransfer * numTransfers
        const senderBalanceBefore = await archToken.balanceOf(deployer.address)
        const aliceBalanceBefore = await archToken.balanceOf(alice.address)
        const bobBalanceBefore = await archToken.balanceOf(bob.address)
        await archToken.approve(multisend.address, totalAmount)
        expect(await archToken.allowance(deployer.address, multisend.address)).to.eq(totalAmount)
        await multisend.batchTransfer(totalAmount, [alice.address, bob.address], [amountPerTransfer, amountPerTransfer])
        expect(await archToken.balanceOf(deployer.address)).to.eq(senderBalanceBefore.sub(totalAmount))
        expect(await archToken.balanceOf(alice.address)).to.eq(aliceBalanceBefore.add(amountPerTransfer))
        expect(await archToken.balanceOf(bob.address)).to.eq(bobBalanceBefore.add(amountPerTransfer))
        expect(await archToken.allowance(deployer.address, multisend.address)).to.eq(0)
      })

      it('cannot transfer in excess of the total contract allowance when performing batch transfer', async () => {
        const amountPerTransfer = 100
        const numTransfers = 2
        const totalAmount = amountPerTransfer * numTransfers
        const senderBalanceBefore = await archToken.balanceOf(deployer.address)
        const aliceBalanceBefore = await archToken.balanceOf(alice.address)
        const bobBalanceBefore = await archToken.balanceOf(bob.address)
        await archToken.approve(multisend.address, amountPerTransfer)
        await expect(multisend.batchTransfer(totalAmount, [alice.address, bob.address], [amountPerTransfer, amountPerTransfer])).to.revertedWith("revert Multisend::_batchTransfer: allowance too low")
        expect(await archToken.balanceOf(deployer.address)).to.eq(senderBalanceBefore)
        expect(await archToken.balanceOf(alice.address)).to.eq(aliceBalanceBefore)
        expect(await archToken.balanceOf(bob.address)).to.eq(bobBalanceBefore)
        expect(await archToken.allowance(deployer.address, multisend.address)).to.eq(amountPerTransfer)
      })

      it('cannot pass in recipients and amounts with different lengths', async () => {
        const amountPerTransfer = 100
        await archToken.approve(multisend.address, amountPerTransfer)
        await expect(multisend.batchTransfer(amountPerTransfer, [alice.address, bob.address], [amountPerTransfer])).to.revertedWith("revert Multisend::_batchTransfer: recipients length != amounts length")
      })

      it('cannot pass in a total amount that is different from the transferred total', async () => {
        const amountPerTransfer = 100
        const numTransfers = 2
        const totalAmount = amountPerTransfer * numTransfers
        const tooMuch = totalAmount + 1
        await archToken.approve(multisend.address, tooMuch)
        await expect(multisend.batchTransfer(tooMuch, [alice.address, bob.address], [amountPerTransfer, amountPerTransfer])).to.revertedWith("revert Multisend::_batchTransfer: total != transferred amount")
      })
    })

    context('batchTransferWithPermit', async () => {
      it('allows a single valid transfer in batch', async () => {
        const amount = 100
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
                  [PERMIT_TYPEHASH, deployer.address, multisend.address, amount, nonce, deadline]
                )
              ),
            ]
          )
        )

        const { v, r, s } = ecsign(Buffer.from(digest.slice(2), 'hex'), Buffer.from(DEPLOYER_PRIVATE_KEY, 'hex'))
        const senderBalanceBefore = await archToken.balanceOf(deployer.address)
        const receiverBalanceBefore = await archToken.balanceOf(bob.address)
        await multisend.batchTransferWithPermit(amount, [alice.address], [amount], deadline, v, r, s)
        expect(await archToken.balanceOf(deployer.address)).to.eq(senderBalanceBefore.sub(amount))
        expect(await archToken.balanceOf(alice.address)).to.eq(receiverBalanceBefore.add(amount))
        expect(await archToken.allowance(deployer.address, multisend.address)).to.eq(0)
      })

      it('allows multiple valid transfers in batch', async () => {
        const amountPerTransfer = 100
        const numTransfers = 2
        const totalAmount = amountPerTransfer * numTransfers
        const senderBalanceBefore = await archToken.balanceOf(deployer.address)
        const aliceBalanceBefore = await archToken.balanceOf(alice.address)
        const bobBalanceBefore = await archToken.balanceOf(bob.address)
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
                  [PERMIT_TYPEHASH, deployer.address, multisend.address, totalAmount, nonce, deadline]
                )
              ),
            ]
          )
        )

        const { v, r, s } = ecsign(Buffer.from(digest.slice(2), 'hex'), Buffer.from(DEPLOYER_PRIVATE_KEY, 'hex'))
        await multisend.batchTransferWithPermit(totalAmount, [alice.address, bob.address], [amountPerTransfer, amountPerTransfer], deadline, v, r, s)
        expect(await archToken.balanceOf(deployer.address)).to.eq(senderBalanceBefore.sub(totalAmount))
        expect(await archToken.balanceOf(alice.address)).to.eq(aliceBalanceBefore.add(amountPerTransfer))
        expect(await archToken.balanceOf(bob.address)).to.eq(bobBalanceBefore.add(amountPerTransfer))
        expect(await archToken.allowance(deployer.address, multisend.address)).to.eq(0)
      })

      it('does not allow permit intended for user directly instead of contract', async () => {
        const amount = 100
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
                  [PERMIT_TYPEHASH, deployer.address, alice.address, amount, nonce, deadline]
                )
              ),
            ]
          )
        )
  
        const { v, r, s } = ecsign(Buffer.from(digest.slice(2), 'hex'), Buffer.from(DEPLOYER_PRIVATE_KEY, 'hex'))
        await expect(multisend.batchTransferWithPermit(amount, [alice.address], [amount], deadline, v, r, s)).to.revertedWith("")
      })
    })
  })