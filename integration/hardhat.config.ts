import type { HardhatUserConfig } from "hardhat/config";
import "@nomicfoundation/hardhat-toolbox-viem";
import "@nomicfoundation/hardhat-viem";

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
      chainId: 31337,
      allowUnlimitedContractSize: true,
    },
  },
  mocha: {
    loader: 'tsx',
  },
};

export default config;
