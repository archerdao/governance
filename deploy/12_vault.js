const UNI_PAIR_ABI = [
    {
        "constant": true,
        "inputs": [
            {
            "internalType": "address",
            "name": "owner",
            "type": "address"
            }
        ],
        "name": "balanceOf",
        "outputs": [
            {
            "internalType": "uint256",
            "name": "",
            "type": "uint256"
            }
        ],
        "payable": false,
        "stateMutability": "view",
        "type": "function"
    }
]

module.exports = async function ({ ethers, getNamedAccounts, deployments }) {
    const { getUniswapLiquidity } = require("../scripts/getUniswapLiquidity")
    const { lockLPTokens } = require("../scripts/lockLPTokens")
    const { deploy, log } = deployments;
    const namedAccounts = await getNamedAccounts();
    const { deployer } = namedAccounts;

    log(`12) Vault`)
    const { poolAddress } = await getUniswapLiquidity()
    // Deploy Vault contract
    const deployResult = await deploy("Vault", {
        from: deployer,
        contract: "Vault",
        gas: 4000000,
        args: [poolAddress],
        skipIfAlreadyDeployed: true
    });

    if (deployResult.newlyDeployed) {
        log(`- ${deployResult.contractName} deployed at ${deployResult.address} using ${deployResult.receipt.gasUsed} gas`);
    } else {
        log(`- Deployment skipped, using previous deployment at: ${deployResult.address}`)
    }

    // Lock LP Tokens
    await lockLPTokens()
};

module.exports.skip = async function({ ethers, deployments, getNamedAccounts }) {
    const { getUniswapLiquidity } = require("../scripts/getUniswapLiquidity")
    const { log } = deployments;
    const namedAccounts = await getNamedAccounts();
    const { liquidityProvider } = namedAccounts;
    const lpSigner = await ethers.getSigner(liquidityProvider)
    const ZERO_ADDRESS = "0x0000000000000000000000000000000000000000"
    const { poolAddress } = await getUniswapLiquidity()
    if(poolAddress == ZERO_ADDRESS) {
        log(`12) Vault`)
        log(`- Skipping step, Uniswap pool has not been created yet`)
        return true
    } else {
        const uniPool = new ethers.Contract(poolAddress, UNI_PAIR_ABI, lpSigner)
        const lpBalance = await uniPool.balanceOf(liquidityProvider)
        
        if (lpBalance.gt(0)) {
            return false
        } else {
            log(`12) Vault`)
            log(`- Skipping step, liquidity provider does not have any LP tokens`)
            return true
        }
    }
}

module.exports.tags = ["12", "Vault"];
module.exports.dependencies = ["11"]