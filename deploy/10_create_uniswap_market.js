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
    const { execute, log } = deployments;
    const namedAccounts = await getNamedAccounts();
    const { deployer, liquidityProvider, admin } = namedAccounts;
    const lpSigner = await ethers.getSigner(liquidityProvider)
    const archToken = await deployments.get("ArchToken");
    const TARGET_ETH_LIQUIDITY = process.env.TARGET_ETH_LIQUIDITY
    const TARGET_TOKEN_LIQUIDITY = process.env.TARGET_TOKEN_LIQUIDITY
    const uniRouter = new ethers.Contract(UNI_ROUTER_ADDRESS, UNI_ROUTER_ABI, lpSigner)

    log(`9) Create Uniswap Market`)
    // Approve Uniswap router to move `TARGET_TOKEN_LIQUIDITY` tokens
    await execute('ArchToken', { from: liquidityProvider }, 'approve', UNI_ROUTER_ADDRESS, TARGET_TOKEN_LIQUIDITY);

    const WETH_ADDRESS = await uniRouter.WETH()
    const weth = new ethers.Contract(WETH_ADDRESS, WETH_ABI, lpSigner)
    await weth.approve(UNI_ROUTER_ADDRESS, TARGET_ETH_LIQUIDITY)

    // Transfer `TARGET_TOKEN_LIQUIDITY` tokens to liquidity provider address
    await execute('ArchToken', { from: deployer }, 'transfer', liquidityProvider, TARGET_TOKEN_LIQUIDITY);


    // Deadline for adding liquidity = now + 20 minutes
    const deadline = Date.now() + 1200

    // Create Uniswap market + provide initial liquidity
    await uniRouter.addLiquidityETH(archToken.address, TARGET_TOKEN_LIQUIDITY, TARGET_TOKEN_LIQUIDITY, TARGET_ETH_LIQUIDITY, admin, deadline, { value: TARGET_ETH_LIQUIDITY, gasLimit: 6000000 })
    const { tokenLiquidity, ethLiquidity } = await getUniswapLiquidity()
    if (tokenLiquidity.gte(TARGET_TOKEN_LIQUIDITY) && ethLiquidity.gte(TARGET_ETH_LIQUIDITY)) {
        log(`- Created Uniswap market. Token liquidity: ${tokenLiquidity.toString()}, ETH liquidity: ${ethLiquidity.toString()}`);
    } else {
        log(`- Error creating Uniswap market`)
    }
};

module.exports.skip = async function({ ethers, deployments, getNamedAccounts }) {
    const { getUniswapLiquidity } = require("../scripts/getUniswapLiquidity")
    const { read, log } = deployments;
    const namedAccounts = await getNamedAccounts();
    const { deployer, liquidityProvider } = namedAccounts;    
    const TARGET_ETH_LIQUIDITY = process.env.TARGET_ETH_LIQUIDITY
    const TARGET_TOKEN_LIQUIDITY = process.env.TARGET_TOKEN_LIQUIDITY
    const { tokenLiquidity, ethLiquidity } = await getUniswapLiquidity()
    const lpETHBalance = await ethers.provider.getBalance(liquidityProvider)
    const deployerTokenBalance = await read('ArchToken', 'balanceOf', deployer)
    
    if (tokenLiquidity.gte(TARGET_TOKEN_LIQUIDITY)) {
        log(`10) Create Uniswap Market`)
        log(`- Skipping step, Uniswap liquidity already provided`)
        return true
    } else if (deployerTokenBalance.lt(TARGET_TOKEN_LIQUIDITY)){
        log(`10) Create Uniswap Market`)
        log(`- Skipping step, deployer account does not have enough tokens`)
        return true
    } else if (lpETHBalance.lt(TARGET_ETH_LIQUIDITY)){
        log(`10) Create Uniswap Market`)
        log(`- Skipping step, liquidity provider account does not have enough ETH`)
        return true
    } else {
        return false
    }
}

module.exports.tags = ["10", "UniswapMarket"];
module.exports.dependencies = ["9"]