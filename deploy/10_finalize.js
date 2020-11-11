const { getSigner } = require("hardhat-deploy-ethers/dist/src/helpers");

module.exports = async ({ ethers, getNamedAccounts, deployments }) => {
    const { execute, read, log } = deployments;
    const { deployer, admin } = await getNamedAccounts();
    const deployerSigner = await ethers.getSigner(deployer);
    const archToken = await deployments.get("ArchToken");
    const votingPowerImplementation = await deployments.get("VotingPower");
    const votingPowerPrism = await deployments.get("VotingPowerPrism");
    const votingPower = new ethers.Contract(votingPowerPrism.address, votingPowerImplementation.abi, deployerSigner);
    const ZERO_ADDRESS = "0x0000000000000000000000000000000000000000"
    const TARGET_TOKEN_LIQUIDITY = process.env.TARGET_TOKEN_LIQUIDITY
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

    let finalized = true;
  
    log(`10) Finalize`)
    // Transfer remaining deployer Arch tokens to multisig
    log(`- Transferring remaining deployer Arch tokens to admin address: ${admin}`)
    let deployerBalance = await read('ArchToken', 'balanceOf', deployer);
    let adminBalance = await read('ArchToken', 'balanceOf', admin);
    if(deployerBalance > 0) {
      await execute('ArchToken', {from: deployer}, 'transfer', admin, deployerBalance);
      deployerBalance = await read('ArchToken', 'balanceOf', deployer);
      adminBalance = await read('ArchToken', 'balanceOf', admin);
    }

    // Make sure deployer no longer has balance
    if(deployerBalance > 0) {
      log(`  - ISSUE: deployer balance > 0. Current balance: ${deployerBalance.toString()}`)
      finalized = false
    }

    // Make sure admin has balance
    if(adminBalance == 0) {
      log(`  - ISSUE: admin balance == 0. Current balance: ${adminBalance.toString()}`)
      finalized = false
    }

    // Check that admin is vesting owner
    log(`- Checking that vesting contract owner is admin: ${admin}...`)
    const vestingOwner = await read('Vesting', 'owner');
    if(vestingOwner != admin) {
      log(`  - ISSUE: Vesting contract owner is not admin: ${admin}, current owner: ${vestingOwner}`)
      finalized = false
    }

    // Check that supply manager contract is token supply manager
    log(`- Checking that supply manager contract is token supply manager...`)
    const supplyManager = await deployments.get("SupplyManager");
    const tokenSupplyManager = await read('ArchToken', 'supplyManager');
    if(tokenSupplyManager != supplyManager.address) {
        log(`  - ISSUE: Token supply manager is not contract at ${supplyManager.address}, current supply manager: ${tokenSupplyManager}`)
        finalized = false
    }

    // Check that voting power is initialized
    log(`- Checking that voting power is initialized...`)
    const vpArchToken = await votingPower.archToken()
    const vpVesting = await votingPower.vestingContract()
    if(vpArchToken == ZERO_ADDRESS || vpVesting == ZERO_ADDRESS) {
        log(`  - ISSUE: Voting power has not yet been initialized. Please initialize via prism proxy at ${votingPower.address}`)
        finalized = false
    }

    // Check if multisig has accepted itself as admin of voting power
    log(`- Checking that ${admin} has accepted role as admin of voting power...`)
    const votingPowerAdmin = await read('VotingPowerPrism', 'proxyAdmin')
    if(votingPowerAdmin != admin) {
        log(`  - ISSUE: Multisig has not yet called 'acceptAdmin' on the voting power prism proxy at ${votingPower.address}`)
        finalized = false
    }

    // Check that Uniswap pool has been created
    log(`- Checking that Uniswap pool has been created...`)
    const uniRouter = new ethers.Contract(UNI_ROUTER_ADDRESS, UNI_ROUTER_ABI, deployerSigner)
    const UNI_FACTORY_ADDRESS = await uniRouter.factory()
    const WETH_ADDRESS = await uniRouter.WETH()
    const uniFactory = new ethers.Contract(UNI_FACTORY_ADDRESS, UNI_FACTORY_ABI, deployerSigner)
    const UNI_PAIR_ADDRESS = await uniFactory.getPair(WETH_ADDRESS, archToken.address)
    if (UNI_PAIR_ADDRESS && UNI_PAIR_ADDRESS != ZERO_ADDRESS) {
      const uniPair = new ethers.Contract(UNI_PAIR_ADDRESS, UNI_PAIR_ABI, deployerSigner)
      const { tokenLiquidity } = await uniPair.getReserves()
      // Check that target liquidity has been added to Uniswap pool
      if(tokenLiquidity < TARGET_TOKEN_LIQUIDITY) {
          log(`  - ISSUE: Liquidity has not been added to Uniswap pool`)
          finalized = false
      }
    } else {
      log(`  - ISSUE: Uniswap pool has not yet been created`)
      finalized = false
    }

    if(finalized) {
        log(`- Deployment finished`)
    } else {
        log(`- Deployment not finalized. Please address issues above and retry.`)
    }
};
  
module.exports.tags = ["10", "Finalize"]
module.exports.dependencies = ["1", "2", "3", "4", "5", "6", "7", "8", "9"]