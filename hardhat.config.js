require("@nomiclabs/hardhat-waffle");
require("@nomiclabs/hardhat-etherscan");
require("hardhat-deploy");
require("hardhat-deploy-ethers");
require('hardhat-abi-exporter');
require('hardhat-log-remover');
require("@tenderly/hardhat-tenderly");
require("hardhat-gas-reporter");

const INFURA_KEY = process.env.INFURA_KEY
const FORK_URL = process.env.FORK_URL
const FORK_BLOCK_NUMBER = process.env.FORK_BLOCK_NUMBER
const ETHERSCAN_API_KEY = process.env.ETHERSCAN_API_KEY
const DEPLOYER_ADDRESS = process.env.DEPLOYER_ADDRESS
const DEPLOYER_PRIVATE_KEY = process.env.DEPLOYER_PRIVATE_KEY
const VP_DEPLOYER_ADDRESS = process.env.VP_DEPLOYER_ADDRESS
const VP_DEPLOYER_PRIVATE_KEY = process.env.VP_DEPLOYER_PRIVATE_KEY
const LIQUIDITY_PROVIDER_ADDRESS = process.env.LIQUIDITY_PROVIDER_ADDRESS
const LIQUIDITY_PROVIDER_PRIVATE_KEY = process.env.LIQUIDITY_PROVIDER_PRIVATE_KEY
const STAKER_ADDRESS = process.env.STAKER_ADDRESS
const STAKER_PRIVATE_KEY = process.env.STAKER_PRIVATE_KEY
const ADMIN_ADDRESS = process.env.ADMIN_ADDRESS
const TENDERLY_USERNAME = process.env.TENDERLY_USERNAME
const TENDERLY_PROJECT_NAME = process.env.TENDERLY_PROJECT_NAME
const REPORT_GAS = process.env.REPORT_GAS
const CMC_API_KEY = process.env.CMC_API_KEY

// Default Hardhat network config
let hardhatConfig = {
  live: false,
  saveDeployments: true,
  tags: ["test"]
}

let localhostConfig = {
  url: 'http://localhost:8545',
  live: false,
  saveDeployments: true,
  tags: ["local"]
}

// If FORK_URL env var is set, enable forking on Hardhat network
// Documentation: https://hardhat.org/hardhat-network/#mainnet-forking
if (FORK_URL && FORK_URL.length > 0) {
  hardhatConfig.forking = {}
  hardhatConfig.forking.url = FORK_URL
  hardhatConfig.tags.push("dev")
  localhostConfig.chainId = 1
  localhostConfig.forking = {}
  localhostConfig.forking.url = FORK_URL
  localhostConfig.tags.push("dev")
  // If FORK_BLOCK_NUMBER env var is set, create fork from specific block
  if (FORK_BLOCK_NUMBER && parseInt(FORK_BLOCK_NUMBER)) {
    hardhatConfig.forking.blockNumber = parseInt(FORK_BLOCK_NUMBER)
    localhostConfig.forking.blockNumber = parseInt(FORK_BLOCK_NUMBER)
  }
} else {
  hardhatConfig.tags.push("local")
}

let rinkebyConfig = {
  url: "https://rinkeby.infura.io/v3/" + INFURA_KEY,
  chainId: 4,
  live: true,
  saveDeployments: true,
  tags: ["staging"],
}

let mainnetConfig = {
  url: "https://mainnet.infura.io/v3/" + INFURA_KEY,
  chainId: 1,
  live: true,
  saveDeployments: true,
  tags: ["prod", "mainnet", "live"]
}

if (DEPLOYER_PRIVATE_KEY && DEPLOYER_PRIVATE_KEY.length > 0) {
  // localhostConfig.accounts = [DEPLOYER_PRIVATE_KEY]
  rinkebyConfig.accounts = [DEPLOYER_PRIVATE_KEY]
  mainnetConfig.accounts = [DEPLOYER_PRIVATE_KEY]
  if (LIQUIDITY_PROVIDER_PRIVATE_KEY && LIQUIDITY_PROVIDER_PRIVATE_KEY.length > 0) {
    // localhostConfig.accounts.push(LIQUIDITY_PROVIDER_PRIVATE_KEY)
    rinkebyConfig.accounts.push(LIQUIDITY_PROVIDER_PRIVATE_KEY)
    mainnetConfig.accounts.push(LIQUIDITY_PROVIDER_PRIVATE_KEY)
  }

  if (VP_DEPLOYER_PRIVATE_KEY && VP_DEPLOYER_PRIVATE_KEY.length > 0) {
    // localhostConfig.accounts.push(VP_DEPLOYER_PRIVATE_KEY)
    rinkebyConfig.accounts.push(VP_DEPLOYER_PRIVATE_KEY)
    mainnetConfig.accounts.push(VP_DEPLOYER_PRIVATE_KEY)
  }

  if (STAKER_PRIVATE_KEY && STAKER_PRIVATE_KEY.length > 0) {
    // localhostConfig.accounts.push(STAKER_PRIVATE_KEY)
    rinkebyConfig.accounts.push(STAKER_PRIVATE_KEY)
    mainnetConfig.accounts.push(STAKER_PRIVATE_KEY)
  }
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
  solidity: {
    version: "0.7.4",
    settings: {
      optimizer: {
        enabled: true,
        runs: 999999
      }
    }
  },
  mocha: {
    timeout: 350000
  },
  defaultNetwork: "hardhat",
  networks: {
    hardhat: hardhatConfig,
    localhost: localhostConfig,
    rinkeby: rinkebyConfig,
    mainnet: mainnetConfig
  },
  etherscan: {
    apiKey: ETHERSCAN_API_KEY
  },
  namedAccounts: {
    deployer: {
      default: 0,
      1: DEPLOYER_ADDRESS,
      4: DEPLOYER_ADDRESS
    },
    liquidityProvider: {
      default: 1,
      1: LIQUIDITY_PROVIDER_ADDRESS,
      4: LIQUIDITY_PROVIDER_ADDRESS
    },
    vpDeployer: {
      default: 2,
      1: VP_DEPLOYER_ADDRESS,
      4: VP_DEPLOYER_ADDRESS
    },
    staker: {
      default: 3,
      1: STAKER_ADDRESS,
      4: STAKER_ADDRESS
    },
    admin: {
      default: 4,
      1: ADMIN_ADDRESS,
      4: ADMIN_ADDRESS
    }
  },
  paths: {
    deploy: 'deploy',
    deployments: 'deployments',
    imports: `imports`
  },
  abiExporter: {
    path: './abis',
    clear: true,
    flat: true
  },
  tenderly: {
    username: TENDERLY_USERNAME,
    project: TENDERLY_PROJECT_NAME
  },
  gasReporter: {
    enabled: REPORT_GAS && REPORT_GAS == "true" ? true : false,
    coinmarketcap: CMC_API_KEY,
    currency: 'USD',
    showTimeSpent: true
  }
};