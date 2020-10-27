const { ethers, deployments, getNamedAccounts, getUnnamedAccounts } = require("hardhat");

const governanceFixture = deployments.createFixture(async ({deployments, getNamedAccounts, getUnnamedAccounts, ethers}, options) => {
    await deployments.fixture();
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
    const ArchToken = await ArchTokenFactory.deploy(admin.address, admin.address, deployer.address, firstSupplyChangeAllowed);
    return {
        archToken: ArchToken,
        deployer: deployer,
        admin: admin,
        alice: alice,
        bob: bob,
        carlos: carlos
    };
})

module.exports.governanceFixture = governanceFixture;