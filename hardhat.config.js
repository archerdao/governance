require("@nomiclabs/hardhat-waffle");
require("@nomiclabs/hardhat-etherscan");
require("hardhat-deploy");
require("hardhat-deploy-ethers");

const INFURA_KEY = process.env.INFURA_KEY
const FORK_URL = process.env.FORK_URL
const FORK_BLOCK_NUMBER = process.env.FORK_BLOCK_NUMBER
const ETHERSCAN_API_KEY = process.env.ETHERSCAN_API_KEY
const DEPLOYER_ADDRESS = process.env.DEPLOYER_ADDRESS
const DEPLOYER_PRIVATE_KEY = process.env.DEPLOYER_PRIVATE_KEY
const ADMIN_ADDRESS = process.env.ADMIN_ADDRESS
const CMC_API_KEY = process.env.CMC_API_KEY

// Default Hardhat network config
let hardhatConfig = {
  live: false,
  saveDeployments: true,
  tags: ["test", "local"]
}

// If FORK_URL env var is set, enable forking on Hardhat network
// Documentation: https://hardhat.org/hardhat-network/#mainnet-forking
if (FORK_URL && FORK_URL.length > 0) {
  hardhatConfig.forking = {}
  hardhatConfig.forking.url = FORK_URL
  // If FORK_BLOCK_NUMBER env var is set, create fork from specific block
  if (FORK_BLOCK_NUMBER && parseInt(FORK_BLOCK_NUMBER)) {
    hardhatConfig.forking.blockNumber = FORK_BLOCK_NUMBER
  }
}

let mainnetConfig = {
  url: "https://mainnet.infura.io/v3/" + INFURA_KEY,
  chainId: 1,
  live: true,
  saveDeployments: true,
  tags: ["prod", "mainnet", "live"]
}

if (DEPLOYER_PRIVATE_KEY && DEPLOYER_PRIVATE_KEY.length > 0) {
  mainnetConfig.accounts = [DEPLOYER_PRIVATE_KEY]
}

// Hardhat tasks
// Documentation: https://hardhat.org/guides/create-task.html
task("accounts", "Prints the list of accounts", async () => {
  const accounts = await ethers.getSigners();

  for (const account of accounts) {
    console.log(account.address);
  }
});

// Hardhat Config
// Documentation: https://hardhat.org/config/
// Deploy add-ons: https://hardhat.org/plugins/hardhat-deploy.html
module.exports = {
  defaultNetwork: "hardhat",
  networks: {
    hardhat: hardhatConfig,
    localhost: {
      url: 'http://localhost:8545',
      live: false,
      saveDeployments: true,
      tags: ["local"]
    },
    rinkeby: {
      url: "https://rinkeby.infura.io/v3/" + INFURA_KEY,
      chainId: 4,
      live: true,
      saveDeployments: true,
      tags: ["staging"]
    },
    mainnet: mainnetConfig
  },
  etherscan: {
    apiKey: ETHERSCAN_API_KEY
  },
  namedAccounts: {
    deployer: {
      default: 0,
      1: DEPLOYER_ADDRESS,
    },
    admin: {
      default: 1,
      1: ADMIN_ADDRESS,
    }
  },
  solidity: "0.7.4",
  settings: {
    optimizer: {
      enabled: true,
      runs: 9999
    }
  }
};