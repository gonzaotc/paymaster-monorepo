import { z } from 'zod';

const envSchema = z.object({
  NEXT_PUBLIC_PRIVY_APP_ID: z
    .string()
    .min(1, 'NEXT_PUBLIC_PRIVY_APP_ID is required'),
  NEXT_PUBLIC_CHAIN_ID: z.string().min(1, 'NEXT_PUBLIC_CHAIN_ID is required'),
  NEXT_PUBLIC_RPC_URL: z.url('NEXT_PUBLIC_RPC_URL must be a valid URL'),
  NEXT_PUBLIC_PAYMASTER_ADDRESS: z
    .string()
    .min(1, 'NEXT_PUBLIC_PAYMASTER_ADDRESS is required'),
});

const parsedEnv = envSchema.parse({
  NEXT_PUBLIC_PRIVY_APP_ID: process.env.NEXT_PUBLIC_PRIVY_APP_ID,
  NEXT_PUBLIC_CHAIN_ID: process.env.NEXT_PUBLIC_CHAIN_ID,
  NEXT_PUBLIC_RPC_URL: process.env.NEXT_PUBLIC_RPC_URL,
  NEXT_PUBLIC_PAYMASTER_ADDRESS: process.env.NEXT_PUBLIC_PAYMASTER_ADDRESS,
});

export const env = {
  privyAppId: parsedEnv.NEXT_PUBLIC_PRIVY_APP_ID,
  chainId: parsedEnv.NEXT_PUBLIC_CHAIN_ID,
  rpcUrl: parsedEnv.NEXT_PUBLIC_RPC_URL,
  paymasterAddress: parsedEnv.NEXT_PUBLIC_PAYMASTER_ADDRESS,
} as const;
