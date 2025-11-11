import { Address, Hex } from "viem";
import { config as dotenvConfig } from "dotenv";
import { resolve } from "path";
import { Chain, sepolia, mainnet } from "viem/chains";

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
    ENTRY_POINT: Address;
    //
    PAYMASTER: Address;
    //
    ORACLE: Address;
    //
    USDC: Address;
    //
    FTC: Address;
    // 
    USER_PRIVATE_KEY: Hex;
    USER_ADDRESS: Address;
    //
    DEPLOYER_PRIVATE_KEY: Hex;
    DEPLOYER_ADDRESS: Address;
    // 
    DEPOSITOR_PRIVATE_KEY: Hex;
    DEPOSITOR_ADDRESS: Address;
    //
    REBALANCER_PRIVATE_KEY: Hex;
    REBALANCER_ADDRESS: Address;
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
        ENTRY_POINT: process.env.ENTRY_POINT as unknown as Address,
        //
        PAYMASTER: process.env.PAYMASTER_SEPOLIA as unknown as Address,
        //
        ORACLE: process.env.ORACLE_SEPOLIA as unknown as Address,
        //
        USDC: process.env.USDC_SEPOLIA as unknown as Address,
        // 
        FTC: process.env.FTC_SEPOLIA as unknown as Address,
        //
        USER_PRIVATE_KEY: process.env.USER_PRIVATE_KEY as unknown as Hex,
        USER_ADDRESS: process.env.USER_ADDRESS as unknown as Address,
        //
        DEPLOYER_PRIVATE_KEY: process.env.DEPLOYER_PRIVATE_KEY as unknown as Hex,
        DEPLOYER_ADDRESS: process.env.DEPLOYER_ADDRESS as unknown as Address,
        //
        DEPOSITOR_PRIVATE_KEY: process.env.DEPOSITOR_PRIVATE_KEY as unknown as Hex,
        DEPOSITOR_ADDRESS: process.env.DEPOSITOR_ADDRESS as unknown as Address,
        //
        REBALANCER_PRIVATE_KEY: process.env.REBALANCER_PRIVATE_KEY as unknown as Hex,
        REBALANCER_ADDRESS: process.env.REBALANCER_ADDRESS as unknown as Address,
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
        ENTRY_POINT: process.env.ENTRY_POINT as unknown as Address,
        //
        PAYMASTER: process.env.PAYMASTER_MAINNET as unknown as Address,
        //
        ORACLE: process.env.ORACLE_MAINNET as unknown as Address,
        //
        USDC: process.env.USDC_MAINNET as unknown as Address,
        //
        FTC: process.env.FTC_MAINNET as unknown as Address,
        //
        USER_PRIVATE_KEY: process.env.USER_PRIVATE_KEY as unknown as Hex,
        USER_ADDRESS: process.env.USER_ADDRESS as unknown as Address,
        //
        DEPLOYER_PRIVATE_KEY: process.env.DEPLOYER_PRIVATE_KEY as unknown as Hex,
        DEPLOYER_ADDRESS: process.env.DEPLOYER_ADDRESS as unknown as Address,
        //
        DEPOSITOR_PRIVATE_KEY: process.env.DEPOSITOR_PRIVATE_KEY as unknown as Hex,
        DEPOSITOR_ADDRESS: process.env.DEPOSITOR_ADDRESS as unknown as Address,
        //
        REBALANCER_PRIVATE_KEY: process.env.REBALANCER_PRIVATE_KEY as unknown as Hex,
        REBALANCER_ADDRESS: process.env.REBALANCER_ADDRESS as unknown as Address,
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
        ENTRY_POINT: `ENTRY_POINT`,
        PAYMASTER: `PAYMASTER_${chainSuffix}`,
        ORACLE: `ORACLE_${chainSuffix}`,
        USDC: `USDC_${chainSuffix}`,
        FTC: `FTC_${chainSuffix}`,
        USER_PRIVATE_KEY: 'USER_PRIVATE_KEY',
        USER_ADDRESS: 'USER_ADDRESS',
        DEPLOYER_PRIVATE_KEY: 'DEPLOYER_PRIVATE_KEY',
        DEPLOYER_ADDRESS: 'DEPLOYER_ADDRESS',
        DEPOSITOR_PRIVATE_KEY: 'DEPOSITOR_PRIVATE_KEY',
        DEPOSITOR_ADDRESS: 'DEPOSITOR_ADDRESS',
        REBALANCER_PRIVATE_KEY: 'REBALANCER_PRIVATE_KEY',
        REBALANCER_ADDRESS: 'REBALANCER_ADDRESS',
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
        case 'mainnet':
            return mainnet;
    }
    throw new Error(`Chain ${name} not found`);
}