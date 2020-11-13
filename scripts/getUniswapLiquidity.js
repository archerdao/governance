const { ethers, getNamedAccounts, deployments } = require("hardhat");
const ZERO_ADDRESS = "0x0000000000000000000000000000000000000000"
const UNI_ROUTER_ADDRESS = process.env.UNI_ROUTER_ADDRESS
const UNI_ROUTER_ABI = [{
    "inputs": [],
    "name": "WETH",
    "outputs": [
        {
        "internalType": "address",
        "name": "",
        "type": "address"
        }
    ],
    "stateMutability": "pure",
    "type": "function"
    },
    {
    "inputs": [],
    "name": "factory",
    "outputs": [
        {
        "internalType": "address",
        "name": "",
        "type": "address"
        }
    ],
    "stateMutability": "pure",
    "type": "function"
}]

const UNI_FACTORY_ABI = [{
    "constant": true,
    "inputs": [
        {
        "internalType": "address",
        "name": "tokenA",
        "type": "address"
        },
        {
        "internalType": "address",
        "name": "tokenB",
        "type": "address"
        }
    ],
    "name": "getPair",
    "outputs": [
        {
        "internalType": "address",
        "name": "pair",
        "type": "address"
        }
    ],
    "payable": false,
    "stateMutability": "view",
    "type": "function"
}]

const UNI_PAIR_ABI = [{
    "constant": true,
    "inputs": [],
    "name": "getReserves",
    "outputs": [
        {
        "internalType": "uint112",
        "name": "reserve0",
        "type": "uint112"
        },
        {
        "internalType": "uint112",
        "name": "reserve1",
        "type": "uint112"
        },
        {
        "internalType": "uint32",
        "name": "blockTimestampLast",
        "type": "uint32"
        }
    ],
    "payable": false,
    "stateMutability": "view",
    "type": "function"
}]


async function getUniswapLiquidity() {
    const { deployer } = await getNamedAccounts();
    const archToken = await deployments.get("ArchToken");
    const deployerSigner = await ethers.getSigner(deployer);
    const uniRouter = new ethers.Contract(UNI_ROUTER_ADDRESS, UNI_ROUTER_ABI, deployerSigner)
    const UNI_FACTORY_ADDRESS = await uniRouter.factory()
    const WETH_ADDRESS = await uniRouter.WETH()
    const uniFactory = new ethers.Contract(UNI_FACTORY_ADDRESS, UNI_FACTORY_ABI, deployerSigner)
    const UNI_PAIR_ADDRESS = await uniFactory.getPair(WETH_ADDRESS, archToken.address)
    if (UNI_PAIR_ADDRESS && UNI_PAIR_ADDRESS != ZERO_ADDRESS) {
        const uniPair = new ethers.Contract(UNI_PAIR_ADDRESS, UNI_PAIR_ABI, deployerSigner)
        const { reserve0, reserve1 } = await uniPair.getReserves()
        return { tokenLiquidity: reserve0, ethLiquidity: reserve1 }
    } else {
        return { tokenLiquidity: ethers.BigNumber.from("0"), ethLiquidity: ethers.BigNumber.from("0") }
    }
}

module.exports.getUniswapLiquidity = getUniswapLiquidity
