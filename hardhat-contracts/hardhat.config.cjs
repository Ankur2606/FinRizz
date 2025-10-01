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
    hardhat: {
      // Hardhat local network
    },
    ogGalileo: {
      name: "0G Galileo Testnet",
      url: "https://evmrpc-testnet.0g.ai",
      chainId: 16602,
      accounts: process.env.PRIVATE_KEY && process.env.PRIVATE_KEY !== "your_private_key_here" 
        ? [process.env.PRIVATE_KEY] 
        : [],
      gasPrice: 20000000000, // 20 gwei
      gas: 2100000,
      timeout: 60000,
      httpHeaders: {}
    }
  },
  etherscan: {
    apiKey: {
      ogGalileo: "your-api-key" // 0G doesn't require API key for verification
    },
    customChains: [
      {
        network: "ogGalileo",
        chainId: 16602,
        urls: {
          apiURL: "https://chainscan-galileo.0g.ai/api",
          browserURL: "https://chainscan-galileo.0g.ai"
        }
      }
    ]
  },
  sourcify: {
    enabled: false
  },
  gasReporter: {
    enabled: true,
    currency: 'USD',
  },
  mocha: {
    timeout: 40000
  }
};