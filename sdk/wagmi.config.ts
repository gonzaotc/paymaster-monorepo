import { defineConfig } from "@wagmi/cli";
import { foundry } from "@wagmi/cli/plugins";

export default defineConfig({
  out: "src/generated/abis.ts",
  contracts: [],
  plugins: [
    foundry({
      project: "../contracts",
      include: [
        "UniversalPaymaster.sol/**",
        "ERC6909NativeEntryPointVault.sol/**",
        "MinimalPaymasterCore.sol/**",
        "Oracle.sol/**",
        "IEntryPoint.sol/**",
        "EntryPoint.sol/**",
      ],
    }),
  ],
});

