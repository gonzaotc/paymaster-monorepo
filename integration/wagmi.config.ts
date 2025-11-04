import { defineConfig } from "@wagmi/cli";
import { foundry } from "@wagmi/cli/plugins";

export default defineConfig({
  out: "generated/abis.ts",
  contracts: [],
  plugins: [
    foundry({
      project: "../contracts",
      include: [
        "UniswapPaymaster.sol/**",
        "MinimalPaymasterCore.sol/**",
        "EntryPointVault.sol/**",
        "PoolManager.sol/**",
        "StateView.sol/**",
      ],
    }),
  ],
});

