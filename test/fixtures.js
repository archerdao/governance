const { ethers, deployments, getNamedAccounts, getUnnamedAccounts } = require("hardhat");

const ZERO_ADDRESS = "0x0000000000000000000000000000000000000000"

const tokenFixture = deployments.createFixture(async ({deployments, getNamedAccounts, getUnnamedAccounts, ethers}, options) => {
    const accounts = await ethers.getSigners();
    const deployer = accounts[0]
    const admin = accounts[3]
    const alice = accounts[4]
    const bob = accounts[5]
    const currentTime = parseInt(Date.now() / 1000);
    const SIX_MONTHS_IN_SECS = 6 * 30 * 24 * 60 * 60;
    const firstSupplyChangeAllowed = currentTime + SIX_MONTHS_IN_SECS;
    const ArchTokenFactory = await ethers.getContractFactory("ArchToken");
    const ArchToken = await ArchTokenFactory.deploy(admin.address, deployer.address, firstSupplyChangeAllowed);
    const MultisendFactory = await ethers.getContractFactory("Multisend");
    const Multisend = await MultisendFactory.deploy(ArchToken.address);
    return {
        archToken: ArchToken,
        multisend: Multisend,
        deployer: deployer,
        admin: admin,
        alice: alice,
        bob: bob,
        ZERO_ADDRESS: ZERO_ADDRESS
    };
})

const governanceFixture = deployments.createFixture(async ({deployments, getNamedAccounts, getUnnamedAccounts, ethers}, options) => {
    const accounts = await ethers.getSigners();
    const deployer = accounts[0]
    const liquidityProvider = accounts[1]
    const admin = accounts[3]
    const alice = accounts[4]
    const bob = accounts[5]
    const currentTime = parseInt(Date.now() / 1000);
    const SIX_MONTHS_IN_SECS = 6 * 30 * 24 * 60 * 60;
    const firstSupplyChangeAllowed = currentTime + SIX_MONTHS_IN_SECS;
    const ArchTokenFactory = await ethers.getContractFactory("ArchToken");
    const ArchToken = await ArchTokenFactory.deploy(admin.address, deployer.address, firstSupplyChangeAllowed);
    const VestingFactory = await ethers.getContractFactory("Vesting");
    const Vesting = await VestingFactory.deploy(ArchToken.address);
    const VotingPowerFactory = await ethers.getContractFactory("VotingPower");
    const VotingPowerImp = await VotingPowerFactory.deploy();
    const VotingPowerPrismFactory = await ethers.getContractFactory("VotingPowerPrism");
    const VotingPowerPrism = await VotingPowerPrismFactory.deploy(deployer.address);
    const VotingPower = new ethers.Contract(VotingPowerPrism.address, VotingPowerImp.interface, deployer)
    const VaultFactory = await ethers.getContractFactory("Vault");
    const Vault = await VaultFactory.deploy();

    return {
        archToken: ArchToken,
        vesting: Vesting,
        votingPower: VotingPower,
        votingPowerImplementation: VotingPowerImp,
        votingPowerPrism: VotingPowerPrism,
        vault: Vault,
        deployer: deployer,
        liquidityProvider: liquidityProvider,
        admin: admin,
        alice: alice,
        bob: bob,
        ZERO_ADDRESS: ZERO_ADDRESS
    };
})

module.exports.tokenFixture = tokenFixture;
module.exports.governanceFixture = governanceFixture;