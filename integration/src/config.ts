import { Address, Hex } from "viem";
import { config as dotenvConfig } from "dotenv";
import { resolve } from "path";

// Load environment variables from .env file
dotenvConfig({ path: resolve(__dirname, "../.env") });

/**
 * Chain type
 */
export type Chain = 'sepolia' | 'mainnet';

/**
 * Chain configuration
 */
export type ChainConfig = {
    id: number;
    name: string;
    // 
    RPC_URL: string;
    BUNDLER_URL: string;
    //
    POOL_MANAGER: Address;
    STATE_VIEW: Address;
    PERMIT2: Address;
    //
    USDC: Address;
    USDC_WHALE: Address;
    // 
    PRIVATE_KEY: Hex;
    ADDRESS: Address;
    RECIPIENT_ADDRESS: Address;
}

/**
 * Chain configuration map
 */
export const chainConfig: Record<Chain, ChainConfig> = {
    sepolia: {
        id: 11155111,
        name: 'Sepolia',
        //
        RPC_URL: process.env.RPC_URL_SEPOLIA as string,
        BUNDLER_URL: process.env.BUNDLER_URL_SEPOLIA as string,
        //
        POOL_MANAGER: process.env.POOL_MANAGER_SEPOLIA as unknown as Address,
        STATE_VIEW: process.env.STATE_VIEW_SEPOLIA as unknown as Address,
        PERMIT2: process.env.PERMIT2_SEPOLIA as unknown as Address,
        //
        USDC: process.env.USDC_SEPOLIA as unknown as Address,
        USDC_WHALE: process.env.USDC_WHALE_SEPOLIA as unknown as Address,
        // 
        PRIVATE_KEY: process.env.PRIVATE_KEY as unknown as Hex,
        ADDRESS: process.env.ADDRESS as unknown as Address,
        RECIPIENT_ADDRESS: process.env.RECIPIENT_ADDRESS as unknown as Address,
    },
    mainnet: {
        id: 1,
        name: 'Mainnet',
        //
        RPC_URL: process.env.RPC_URL_MAINNET as string,
        BUNDLER_URL: process.env.BUNDLER_URL_MAINNET as string,
        //
        POOL_MANAGER: process.env.POOL_MANAGER_MAINNET as unknown as Address,
        STATE_VIEW: process.env.STATE_VIEW_MAINNET as unknown as Address,
        PERMIT2: process.env.PERMIT2_MAINNET as unknown as Address,
        //
        USDC: process.env.USDC_MAINNET as unknown as Address,
        USDC_WHALE: process.env.USDC_WHALE_MAINNET as unknown as Address,
        //
        PRIVATE_KEY: process.env.PRIVATE_KEY as unknown as Hex,
        ADDRESS: process.env.ADDRESS as unknown as Address,
        RECIPIENT_ADDRESS: process.env.RECIPIENT_ADDRESS as unknown as Address,
    },
}

/**
 * Get the chain configuration for the given chain
 * @param chain - The chain to get the configuration for
 * @returns The chain configuration
 */
export const getChainConfig = (chain: Chain): ChainConfig => {
    if (!chainConfig[chain]) {
        throw new Error(`Chain ${chain} not found`);
    }
    const config = chainConfig[chain];
    if (
            !config.RPC_URL ||
            !config.BUNDLER_URL ||
            // 
            !config.POOL_MANAGER ||
            !config.STATE_VIEW ||
            !config.PERMIT2 ||
            // 
            !config.USDC ||
            !config.USDC_WHALE ||
            //
            !config.ADDRESS ||
            !config.PRIVATE_KEY ||
            !config.RECIPIENT_ADDRESS
        ) {
            throw new Error('Missing environment variables');
        }
    return config;
}