module.exports = async ({ ethers, getNamedAccounts, deployments }) => {
    const { getUniswapLiquidity } = require("../scripts/getUniswapLiquidity")
    const { execute, read, log } = deployments
    const { deployer, admin } = await getNamedAccounts()
    const deployerSigner = await ethers.getSigner(deployer)
    const votingPowerImplementation = await deployments.get("VotingPower")
    const votingPowerPrism = await deployments.get("VotingPowerPrism")
    const votingPower = new ethers.Contract(votingPowerPrism.address, votingPowerImplementation.abi, deployerSigner)
    const ZERO_ADDRESS = "0x0000000000000000000000000000000000000000"
    const TARGET_TOKEN_LIQUIDITY = process.env.TARGET_TOKEN_LIQUIDITY
    const TARGET_ETH_LIQUIDITY = process.env.TARGET_ETH_LIQUIDITY
    const PROTOCOL_FUND_ADDRESS = process.env.PROTOCOL_FUND_ADDRESS
    const PROTOCOL_FUND_AMOUNT = process.env.PROTOCOL_FUND_AMOUNT
    const DAO_TREASURY_ADDRESS = process.env.DAO_TREASURY_ADDRESS

    let finalized = true;
  
    log(`13) Finalize`)
    // Transfer Marketing and Development budget to PROTOCOL_FUND_ADDRESS
    log(`- CHECK: marketing and development budget has been sent to protocol fund address: ${PROTOCOL_FUND_ADDRESS}`)
    let protocolBalance = await read('ArchToken', 'balanceOf', PROTOCOL_FUND_ADDRESS);
    if(protocolBalance == 0) {
      const decimals = await deployments.read('ArchToken', 'decimals')
      const decimalMultiplier = ethers.BigNumber.from(10).pow(decimals)
      const transferAmount = ethers.BigNumber.from(PROTOCOL_FUND_AMOUNT).mul(decimalMultiplier)
      await execute('ArchToken', {from: deployer}, 'transfer', PROTOCOL_FUND_ADDRESS, transferAmount)
      protocolBalance = await read('ArchToken', 'balanceOf', PROTOCOL_FUND_ADDRESS);
      if(protocolBalance < transferAmount) {
        log(`  - ISSUE: marketing and development budget not correct. Current balance: ${protocolBalance.toString()}`)
        finalized = false
      }
    }

    // Transfer remaining deployer Arch tokens to treasury
    log(`- CHECK: remaining deployer Arch tokens have been sent to treasury address: ${DAO_TREASURY_ADDRESS}`)
    let deployerBalance = await read('ArchToken', 'balanceOf', deployer);
    let treasuryBalance = await read('ArchToken', 'balanceOf', DAO_TREASURY_ADDRESS);
    if(deployerBalance > 0) {
      await execute('ArchToken', {from: deployer}, 'transfer', admin, deployerBalance);
      deployerBalance = await read('ArchToken', 'balanceOf', deployer);
      treasuryBalance = await read('ArchToken', 'balanceOf', DAO_TREASURY_ADDRESS);
    }

    // Make sure deployer no longer has balance
    if(deployerBalance > 0) {
      log(`  - ISSUE: deployer balance > 0. Current balance: ${deployerBalance.toString()}`)
      finalized = false
    }

    // Make sure admin has balance
    if(treasuryBalance.eq(0)) {
      log(`  - ISSUE: admin balance == 0. Current balance: ${adminBalance.toString()}`)
      finalized = false
    }

    // Check that admin is vesting owner
    log(`- CHECK: vesting contract owner is admin: ${admin}...`)
    const vestingOwner = await read('Vesting', 'owner');
    if(vestingOwner != admin) {
      log(`  - ISSUE: Vesting contract owner is not admin: ${admin}, current owner: ${vestingOwner}`)
      finalized = false
    }

    // Check that supply manager contract is token supply manager
    log(`- CHECK: supply manager contract is token supply manager...`)
    const supplyManager = await deployments.get("SupplyManager");
    const tokenSupplyManager = await read('ArchToken', 'supplyManager');
    if(tokenSupplyManager != supplyManager.address) {
        log(`  - ISSUE: Token supply manager is not contract at ${supplyManager.address}, current supply manager: ${tokenSupplyManager}`)
        finalized = false
    }

    // Check that voting power is initialized
    log(`- CHECK: voting power is initialized...`)
    const vpArchToken = await votingPower.archToken()
    const vpVesting = await votingPower.vestingContract()
    if(vpArchToken == ZERO_ADDRESS || vpVesting == ZERO_ADDRESS) {
        log(`  - ISSUE: Voting power has not yet been initialized. Please initialize via prism proxy at ${votingPower.address}`)
        finalized = false
    }

    // Check if multisig has accepted itself as admin of voting power
    log(`- CHECK: ${admin} has accepted role as admin of voting power...`)
    const votingPowerAdmin = await read('VotingPowerPrism', 'proxyAdmin')
    if(votingPowerAdmin != admin) {
        log(`  - ISSUE: Multisig has not yet called 'acceptAdmin' on the voting power prism proxy at ${votingPower.address}`)
        finalized = false
    }

    // Check that Uniswap pool has been seeded with target liquidity
    log(`- CHECK: Uniswap pool has been created...`)
    const { poolAddress, tokenLiquidity, ethLiquidity } = await getUniswapLiquidity()
    if(tokenLiquidity.lt(TARGET_TOKEN_LIQUIDITY) || ethLiquidity.lt(TARGET_ETH_LIQUIDITY)) {
        log(`  - ISSUE: Liquidity has not been added to Uniswap pool`)
        finalized = false
    }

    // Check that liquidity provider has locked LP tokens
    log(`- CHECK: LP tokens are locked...`)
    const lockedBalance = await read('Vault', 'getLockedTokenBalance', poolAddress, DAO_TREASURY_ADDRESS)
    if(lockedBalance.eq(0)) {
        log(`  - ISSUE: Liquidity tokens have not been locked`)
        finalized = false
    }

    if(finalized) {
        log(`- Deployment finished`)
    } else {
        log(`- Deployment not finalized. Please address issues above and retry.`)
    }
};
  
module.exports.tags = ["13", "Finalize"]
module.exports.dependencies = ["1", "2", "3", "4", "5", "6", "7", "8", "9", "10", "11", "12"]