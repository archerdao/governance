const { ethers, deployments, getNamedAccounts } = require("hardhat");
const { ecsign } = require("ethereumjs-util")

const { read } = deployments;

const STAKER_PRIVATE_KEY = process.env.STAKER_PRIVATE_KEY
const STAKE_AMOUNT = process.env.STAKE_AMOUNT


const DOMAIN_TYPEHASH = ethers.utils.keccak256(
    ethers.utils.toUtf8Bytes('EIP712Domain(string name,string version,uint256 chainId,address verifyingContract)')
)

const PERMIT_TYPEHASH = ethers.utils.keccak256(
    ethers.utils.toUtf8Bytes('Permit(address owner,address spender,uint256 value,uint256 nonce,uint256 deadline)')
)

let tokenName
let decimals
let decimalMultiplier
let votingPowerImplementation
let votingPowerPrism
let votingPower

async function stakeARCH(staker, amount) {
    decimals = await deployments.read('ArchToken', 'decimals')
    decimalMultiplier = ethers.BigNumber.from(10).pow(decimals)
    votingPowerImplementation = await deployments.get("VotingPower");
    votingPowerPrism = await deployments.get("VotingPowerPrism");
    votingPower = new ethers.Contract(votingPowerPrism.address, votingPowerImplementation.abi, staker)
    await votingPower.stake(decimalMultiplier.mul(amount));
    const receipt = await ethers.provider.waitForTransaction(result.hash)
    if(receipt.status) {
        console.log(`Successfully staked ARCH`);
    } else {
        log(`Error staking ARCH. Tx:`)
        log(receipt)
    }
}

async function stakeARCHWithPermit(staker, amount) {
    const archToken = await deployments.get("ArchToken")
    tokenName = await deployments.read('ArchToken', 'name')
    decimals = await deployments.read('ArchToken', 'decimals')
    decimalMultiplier = ethers.BigNumber.from(10).pow(decimals)
    votingPowerImplementation = await deployments.get("VotingPower");
    votingPowerPrism = await deployments.get("VotingPowerPrism");
    votingPower = new ethers.Contract(votingPowerPrism.address, votingPowerImplementation.abi, staker)

    const stakeAmount = decimalMultiplier.mul(amount)
    const domainSeparator = ethers.utils.keccak256(
        ethers.utils.defaultAbiCoder.encode(
          ['bytes32', 'bytes32', 'bytes32', 'uint256', 'address'],
          [DOMAIN_TYPEHASH, ethers.utils.keccak256(ethers.utils.toUtf8Bytes(tokenName)), ethers.utils.keccak256(ethers.utils.toUtf8Bytes("1")), ethers.provider.network.chainId, archToken.address]
        )
      )

    const nonce = await deployments.read('ArchToken', 'nonces', staker.address)

    // Deadline for distributing tokens = now + 20 minutes
    const deadline = parseInt(Date.now() / 1000) + 1200

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
                [PERMIT_TYPEHASH, staker.address, votingPower.address, stakeAmount, nonce, deadline]
                )
            ),
            ]
        )
    )

    const { v, r, s } = ecsign(Buffer.from(digest.slice(2), 'hex'), Buffer.from(STAKER_PRIVATE_KEY, 'hex'))
    const result = await votingPower.stakeWithPermit(stakeAmount, deadline, v, r, s);
    const receipt = await ethers.provider.waitForTransaction(result.hash)
    if(receipt.status) {
        console.log(`Successfully staked ARCH`);
    } else {
        log(`Error staking ARCH. Tx:`)
        log(receipt)
    }
}

async function printStakedBalance(staker) {
    decimals = await deployments.read('ArchToken', 'decimals')
    decimalMultiplier = ethers.BigNumber.from(10).pow(decimals)
    const votingPowerImplementation = await deployments.get("VotingPower");
    const votingPowerPrism = await deployments.get("VotingPowerPrism");
    const votingPower = new ethers.Contract(votingPowerPrism.address, votingPowerImplementation.abi, staker)
    const stakedBalance = await votingPower.getARCHAmountStaked(staker.address)
    const votingPowerBalance = await votingPower.balanceOf(staker.address)
    console.log(`-----------------------------------------------------`)
    console.log(`Staker: ${staker.address}`)
    console.log(`Stake Balance: ${stakedBalance.div(decimalMultiplier).toString()}`)
    console.log(`Voting Power Balance: ${votingPowerBalance.div(decimalMultiplier).toString()}`)
    console.log(`-----------------------------------------------------`)
}

async function getStakerSigner() {
    const { staker } = await getNamedAccounts()
    const stakerSigner = await ethers.getSigner(staker)
    return stakerSigner
}

if (require.main === module) {
    getStakerSigner()
    .then((stakerSigner) => {
        stakeARCHWithPermit(stakerSigner, STAKE_AMOUNT)
        .then(() => {
            printStakedBalance(stakerSigner)
        })
    })
    .catch((err) => {
        console.log(err)
    })
}

module.exports.stakeARCH = stakeARCH
module.exports.stakeARCHWithPermit = stakeARCHWithPermit
module.exports.printStakedBalance = printStakedBalance