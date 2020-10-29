const { ethers, deployments, getNamedAccounts, getUnnamedAccounts } = require("hardhat");

const tokenFixture = deployments.createFixture(async ({deployments, getNamedAccounts, getUnnamedAccounts, ethers}, options) => {
    const accounts = await ethers.getSigners();
    const deployer = accounts[0]
    const admin = accounts[1]
    const alice = accounts[2]
    const bob = accounts[3]
    const carlos = accounts[4]
    const currentTime = Date.now();
    const SIX_MONTHS_IN_SECS = 6 * 30 * 24 * 60 * 60;
    const firstSupplyChangeAllowed = currentTime + SIX_MONTHS_IN_SECS;
    const ArchTokenFactory = await ethers.getContractFactory("ArchToken");
    const ArchToken = await ArchTokenFactory.deploy(admin.address, deployer.address, firstSupplyChangeAllowed);
    return {
        archToken: ArchToken,
        deployer: deployer,
        admin: admin,
        alice: alice,
        bob: bob,
        carlos: carlos
    };
})

const governanceFixture = deployments.createFixture(async ({deployments, getNamedAccounts, getUnnamedAccounts, ethers}, options) => {
    const accounts = await ethers.getSigners();
    const deployer = accounts[0]
    const admin = accounts[1]
    const alice = accounts[2]
    const bob = accounts[3]
    const carlos = accounts[4]
    const currentTime = Date.now();
    const SIX_MONTHS_IN_SECS = 6 * 30 * 24 * 60 * 60;
    const firstSupplyChangeAllowed = currentTime + SIX_MONTHS_IN_SECS;
    const ArchTokenFactory = await ethers.getContractFactory("ArchToken");
    const ArchToken = await ArchTokenFactory.deploy(admin.address, deployer.address, firstSupplyChangeAllowed);
    const VestingFactory = await ethers.getContractFactory("Vesting");
    const Vesting = await VestingFactory.deploy(ArchToken.address);
    const VotingPowerFactory = await ethers.getContractFactory("VotingPower");
    const VotingPower = await VotingPowerFactory.deploy();
    const VotingPowerPrismFactory = await ethers.getContractFactory("VotingPowerPrism");
    const VotingPowerPrism = await VotingPowerPrismFactory.deploy();
    
    return {
        archToken: ArchToken,
        vesting: Vesting,
        votingPowerImp: VotingPower,
        votingPowerPrism: VotingPowerPrism,
        deployer: deployer,
        admin: admin,
        alice: alice,
        bob: bob,
        carlos: carlos
    };
})

module.exports.tokenFixture = tokenFixture;
module.exports.governanceFixture = governanceFixture;