import type { HardhatUserConfig } from "hardhat/config";
import "@nomicfoundation/hardhat-toolbox-viem";
import "@nomicfoundation/hardhat-viem";
import { config as dotenvConfig } from "dotenv";
import { resolve } from "path";
import { getChainConfig } from "./src/config";

// Load environment variables from .env file
dotenvConfig({ path: resolve(__dirname, ".env") });

export const selectedChain: string = 'sepolia';
export const chainConfig = getChainConfig(selectedChain);

const config: HardhatUserConfig = {
  solidity: {
    version: "0.8.30",
    settings: {
      viaIR: true,
      evmVersion: "prague",
      optimizer: {
        enabled: true,
        runs: 200,
      },
    },
  },
  paths: {
    sources: "./contracts",
    tests: "./test",
    cache: "./cache",
    artifacts: "./artifacts",
  },
  networks: {
    hardhat: {
      chainId: 11155111,
      allowUnlimitedContractSize: true,
      forking: {
        url: chainConfig.RPC_URL,
        enabled: false,
      },
    },
    sepolia: {
      url: process.env.RPC_URL_SEPOLIA || "",
      accounts: process.env.DEPLOYER_PRIVATE_KEY ? [process.env.DEPLOYER_PRIVATE_KEY] : [],
      chainId: 11155111,
    },
    mainnet: {
      url: process.env.RPC_URL_MAINNET || "",
      accounts: process.env.DEPLOYER_PRIVATE_KEY ? [process.env.DEPLOYER_PRIVATE_KEY] : [],
      chainId: 1,
    },
  },
};

export default config;
