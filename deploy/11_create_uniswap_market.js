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
    }, {
    "inputs": [{
            "internalType": "address",
            "name": "token",
            "type": "address"
        },
        {
            "internalType": "uint256",
            "name": "amountTokenDesired",
            "type": "uint256"
        },
        {
            "internalType": "uint256",
            "name": "amountTokenMin",
            "type": "uint256"
        },
        {
            "internalType": "uint256",
            "name": "amountETHMin",
            "type": "uint256"
        },
        {
            "internalType": "address",
            "name": "to",
            "type": "address"
        },
        {
            "internalType": "uint256",
            "name": "deadline",
            "type": "uint256"
        }
    ],
    "name": "addLiquidityETH",
    "outputs": [{
            "internalType": "uint256",
            "name": "amountToken",
            "type": "uint256"
        },
        {
            "internalType": "uint256",
            "name": "amountETH",
            "type": "uint256"
        },
        {
            "internalType": "uint256",
            "name": "liquidity",
            "type": "uint256"
        }
    ],
    "stateMutability": "payable",
    "type": "function"
}]

const WETH_ABI = [{
    "constant": false,
    "inputs": [{
        "name": "guy",
        "type": "address"
    }, {
        "name": "wad",
        "type": "uint256"
    }],
    "name": "approve",
    "outputs": [{
        "name": "",
        "type": "bool"
    }],
    "payable": false,
    "stateMutability": "nonpayable",
    "type": "function"
}]

module.exports = async function ({ ethers, getNamedAccounts, deployments }) {
    const { getUniswapLiquidity } = require("../scripts/getUniswapLiquidity")
    const { execute, read, log } = deployments;
    const namedAccounts = await getNamedAccounts();
    const { deployer, liquidityProvider, admin } = namedAccounts;
    const lpSigner = await ethers.getSigner(liquidityProvider)
    const archToken = await deployments.get("ArchToken");
    const TARGET_ETH_LIQUIDITY = process.env.TARGET_ETH_LIQUIDITY
    const TARGET_TOKEN_LIQUIDITY = process.env.TARGET_TOKEN_LIQUIDITY
    const uniRouter = new ethers.Contract(UNI_ROUTER_ADDRESS, UNI_ROUTER_ABI, lpSigner)
    const PROTOCOL_FUND_ADDRESS = process.env.PROTOCOL_FUND_ADDRESS
    const PROTOCOL_FUND_AMOUNT = process.env.PROTOCOL_FUND_AMOUNT
    const DAO_TREASURY_ADDRESS = process.env.DAO_TREASURY_ADDRESS

    log(`11) Create Uniswap Market`)
    // Approve Uniswap router to move `TARGET_TOKEN_LIQUIDITY` tokens
    await execute('ArchToken', { from: liquidityProvider }, 'approve', UNI_ROUTER_ADDRESS, TARGET_TOKEN_LIQUIDITY);

    const WETH_ADDRESS = await uniRouter.WETH()
    const weth = new ethers.Contract(WETH_ADDRESS, WETH_ABI, lpSigner)
    await weth.approve(UNI_ROUTER_ADDRESS, TARGET_ETH_LIQUIDITY)

    // Deadline for adding liquidity = now + 20 minutes
    const deadline = parseInt(Date.now() / 1000) + 1200

    // Create Uniswap market + provide initial liquidity
    const result = await uniRouter.addLiquidityETH(archToken.address, TARGET_TOKEN_LIQUIDITY, TARGET_TOKEN_LIQUIDITY, TARGET_ETH_LIQUIDITY, liquidityProvider, deadline, { from: liquidityProvider, value: TARGET_ETH_LIQUIDITY, gasLimit: 6000000 })
    if (result.hash) {
        const receipt = await ethers.provider.waitForTransaction(result.hash)
        if(receipt.status) {
            const { tokenLiquidity, ethLiquidity } = await getUniswapLiquidity()
            log(`- Created Uniswap market. Token liquidity: ${tokenLiquidity.toString()}, ETH liquidity: ${ethLiquidity.toString()}`);
        } else {
            log(`- Error creating Uniswap market. Tx:`)
            log(receipt)
        }
    } else {
        log(`- Error creating Uniswap market. Tx:`)
        log(result)
    }

    // Transfer Marketing and Development budget to PROTOCOL_FUND_ADDRESS
    log(`- Transferring marketing and development budget to protocol fund address: ${PROTOCOL_FUND_ADDRESS}`)
    let protocolBalance = await read('ArchToken', 'balanceOf', PROTOCOL_FUND_ADDRESS);
    if(protocolBalance == 0) {
      const decimals = await deployments.read('ArchToken', 'decimals')
      const decimalMultiplier = ethers.BigNumber.from(10).pow(decimals)
      const transferAmount = ethers.BigNumber.from(PROTOCOL_FUND_AMOUNT).mul(decimalMultiplier)
      await execute('ArchToken', {from: deployer}, 'transfer', PROTOCOL_FUND_ADDRESS, transferAmount)
    }

    // Transfer remaining deployer balance to treasury
    log(`- Transferring remaining deployer Arch tokens to treasury address: ${DAO_TREASURY_ADDRESS}`)
    let deployerBalance = await read('ArchToken', 'balanceOf', deployer);
    if(deployerBalance > 0) {
      await execute('ArchToken', {from: deployer}, 'transfer', DAO_TREASURY_ADDRESS, deployerBalance);
    }
};

module.exports.skip = async function({ ethers, deployments, getNamedAccounts }) {
    const { getUniswapLiquidity } = require("../scripts/getUniswapLiquidity")
    const { read, log } = deployments;
    const namedAccounts = await getNamedAccounts();
    const { liquidityProvider } = namedAccounts;    
    const TARGET_ETH_LIQUIDITY = process.env.TARGET_ETH_LIQUIDITY
    const TARGET_TOKEN_LIQUIDITY = process.env.TARGET_TOKEN_LIQUIDITY
    const { tokenLiquidity } = await getUniswapLiquidity()
    const lpETHBalance = await ethers.provider.getBalance(liquidityProvider)
    const lpTokenBalance = await read('ArchToken', 'balanceOf', liquidityProvider)
    
    if (tokenLiquidity.gte(TARGET_TOKEN_LIQUIDITY)) {
        log(`11) Create Uniswap Market`)
        log(`- Skipping step, Uniswap liquidity already provided`)
        return true
    } else if (lpTokenBalance.lt(TARGET_TOKEN_LIQUIDITY)){
        log(`11) Create Uniswap Market`)
        log(`- Skipping step, liquidity provider account does not have enough tokens`)
        return true
    } else if (lpETHBalance.lt(TARGET_ETH_LIQUIDITY)){
        log(`11) Create Uniswap Market`)
        log(`- Skipping step, liquidity provider account does not have enough ETH`)
        return true
    } else {
        return false
    }
}

module.exports.tags = ["11", "UniswapMarket"];
module.exports.dependencies = ["10"]