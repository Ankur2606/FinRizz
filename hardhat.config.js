require("@nomicfoundation/hardhat-toolbox");
require("dotenv").config();

/** @type import('hardhat/config').HardhatUserConfig */
module.exports = {
  solidity: {
    version: "0.8.19",
    settings: {
      optimizer: {
        enabled: true,
        runs: 200
      }
    }
  },
  networks: {
    "og-galileo": {
      url: "https://evmrpc-testnet.0g.ai",
      chainId: 16602,
      accounts: process.env.PRIVATE_KEY ? [process.env.PRIVATE_KEY] : [],
      gasPrice: 'auto',
      gas: 'auto'
    },
    hardhat: {
      chainId: 1337
    }
  },
  paths: {
    sources: "./contracts",
    tests: "./test",
    cache: "./cache",
    artifacts: "./artifacts"
  },
  etherscan: {
    apiKey: {
      "og-galileo": "no-api-key-needed"
    },
    customChains: [
      {
        network: "og-galileo",
        chainId: 16602,
        urls: {
          apiURL: "https://chainscan-newton.0g.ai/api",
          browserURL: "https://chainscan-newton.0g.ai"
        }
      }
    ]
  }
};