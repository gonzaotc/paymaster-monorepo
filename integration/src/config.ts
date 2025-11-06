import { Address, Hex } from "viem";
import { config as dotenvConfig } from "dotenv";
import { resolve } from "path";
import { Chain, sepolia, unichainSepolia, mainnet } from "viem/chains";

// Load environment variables from .env file
dotenvConfig({ path: resolve(__dirname, "../.env") });

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
    PAYMASTER: Address;
    //
    POOL_MANAGER: Address;
    STATE_VIEW: Address;
    PERMIT2: Address;
    //
    USDC: Address;
    // 
    USER_PRIVATE_KEY: Hex;
    USER_ADDRESS: Address;
    //
    DEPLOYER_PRIVATE_KEY: Hex;
    DEPLOYER_ADDRESS: Address;
    //
    RECIPIENT_ADDRESS: Address;
}

/**
 * Chain configuration map
 */
export const chainConfig: Record<string, ChainConfig> = {
    sepolia: {
        id: 11155111,
        name: 'sepolia',
        //
        RPC_URL: process.env.RPC_URL_SEPOLIA as string,
        BUNDLER_URL: process.env.BUNDLER_URL_SEPOLIA as string,
        //
        PAYMASTER: process.env.PAYMASTER_SEPOLIA as unknown as Address,
        //
        POOL_MANAGER: process.env.POOL_MANAGER_SEPOLIA as unknown as Address,
        STATE_VIEW: process.env.STATE_VIEW_SEPOLIA as unknown as Address,
        PERMIT2: process.env.PERMIT2_SEPOLIA as unknown as Address,
        //
        USDC: process.env.USDC_SEPOLIA as unknown as Address,
        // 
        USER_PRIVATE_KEY: process.env.USER_PRIVATE_KEY as unknown as Hex,
        USER_ADDRESS: process.env.USER_ADDRESS as unknown as Address,
        //
        DEPLOYER_PRIVATE_KEY: process.env.DEPLOYER_PRIVATE_KEY as unknown as Hex,
        DEPLOYER_ADDRESS: process.env.DEPLOYER_ADDRESS as unknown as Address,
        //
        RECIPIENT_ADDRESS: process.env.RECIPIENT_ADDRESS as unknown as Address,
    },
    unichainSepolia: {
        id: 1301,
        name: 'unichainSepolia',
        //
        RPC_URL: process.env.RPC_URL_UNICHAIN_SEPOLIA as string,
        BUNDLER_URL: process.env.BUNDLER_URL_UNICHAIN_SEPOLIA as string,
        //
        PAYMASTER: process.env.PAYMASTER_UNICHAIN_SEPOLIA as unknown as Address,
        //
        POOL_MANAGER: process.env.POOL_MANAGER_UNICHAIN_SEPOLIA as unknown as Address,
        STATE_VIEW: process.env.STATE_VIEW_UNICHAIN_SEPOLIA as unknown as Address,
        PERMIT2: process.env.PERMIT2_UNICHAIN_SEPOLIA as unknown as Address,
        //
        USDC: process.env.USDC_UNICHAIN_SEPOLIA as unknown as Address,
        //
        USER_PRIVATE_KEY: process.env.USER_PRIVATE_KEY as unknown as Hex,
        USER_ADDRESS: process.env.USER_ADDRESS as unknown as Address,
        //
        DEPLOYER_PRIVATE_KEY: process.env.DEPLOYER_PRIVATE_KEY as unknown as Hex,
        DEPLOYER_ADDRESS: process.env.DEPLOYER_ADDRESS as unknown as Address,
        //
        RECIPIENT_ADDRESS: process.env.RECIPIENT_ADDRESS as unknown as Address,
    },
    mainnet: {
        id: 1,
        name: 'mainnet',
        //
        RPC_URL: process.env.RPC_URL_MAINNET as string,
        BUNDLER_URL: process.env.BUNDLER_URL_MAINNET as string,
        //
        PAYMASTER: process.env.PAYMASTER_MAINNET as unknown as Address,
        //
        POOL_MANAGER: process.env.POOL_MANAGER_MAINNET as unknown as Address,
        STATE_VIEW: process.env.STATE_VIEW_MAINNET as unknown as Address,
        PERMIT2: process.env.PERMIT2_MAINNET as unknown as Address,
        //
        USDC: process.env.USDC_MAINNET as unknown as Address,
        //
        USER_PRIVATE_KEY: process.env.USER_PRIVATE_KEY as unknown as Hex,
        USER_ADDRESS: process.env.USER_ADDRESS as unknown as Address,
        //
        DEPLOYER_PRIVATE_KEY: process.env.DEPLOYER_PRIVATE_KEY as unknown as Hex,
        DEPLOYER_ADDRESS: process.env.DEPLOYER_ADDRESS as unknown as Address,
        //
        RECIPIENT_ADDRESS: process.env.RECIPIENT_ADDRESS as unknown as Address,
    },
}

/**
 * Get the chain configuration for the given chain
 * @param chain - The chain to get the configuration for
 * @returns The chain configuration
 */
export const getChainConfig = (): [ChainConfig, Chain] => {
    const chain = process.env.SELECTED_NETWORK;
    if (!chain) throw new Error('!SELECTED_NETWORK ENV');

    const viemChain = getChain(chain);

    if (!chainConfig[chain]) {
        throw new Error(`Chain ${chain} not configured`);
    }
    
    const config = chainConfig[chain];
    const chainSuffix = chain.toUpperCase();
    
    // Map of config keys to their corresponding env variable names
    const requiredVars: Record<keyof ChainConfig, string | null> = {
        id: null, // not an env var
        name: null, // not an env var
        RPC_URL: `RPC_URL_${chainSuffix}`,
        BUNDLER_URL: `BUNDLER_URL_${chainSuffix}`,
        PAYMASTER: `PAYMASTER_${chainSuffix}`,
        POOL_MANAGER: `POOL_MANAGER_${chainSuffix}`,
        STATE_VIEW: `STATE_VIEW_${chainSuffix}`,
        PERMIT2: `PERMIT2_${chainSuffix}`,
        USDC: `USDC_${chainSuffix}`,
        USER_PRIVATE_KEY: 'USER_PRIVATE_KEY',
        USER_ADDRESS: 'USER_ADDRESS',
        DEPLOYER_PRIVATE_KEY: 'DEPLOYER_PRIVATE_KEY',
        DEPLOYER_ADDRESS: 'DEPLOYER_ADDRESS',
        RECIPIENT_ADDRESS: 'RECIPIENT_ADDRESS',
    };
    
    const missingVars: string[] = [];
    
    for (const [key, envVar] of Object.entries(requiredVars)) {
        if (envVar && !config[key as keyof ChainConfig]) {
            missingVars.push(envVar);
        }
    }
    
    if (missingVars.length > 0) {
        throw new Error(
            `Missing environment variables for ${chain}:\n  - ${missingVars.join('\n  - ')}`
        );
    }

    return [config, viemChain];
}

function getChain(name: string): Chain {
    switch (name) {
        case 'sepolia':
            return sepolia;
        case 'unichainSepolia':
            return unichainSepolia;
        case 'mainnet':
            return mainnet;
    }
    throw new Error(`Chain ${name} not found`);
}