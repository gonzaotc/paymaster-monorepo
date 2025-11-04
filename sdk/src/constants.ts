import type { Address } from 'viem';

/**
 * Known Permit2 deployments across chains
 * Source: https://github.com/Uniswap/permit2
 */
export const PERMIT2_ADDRESS: Address = '0x000000000022D473030F116dDEE9F6B43aC78BA3';

/**
 * Common EntryPoint v0.7 address
 * Source: https://github.com/eth-infinitism/account-abstraction
 */
export const ENTRYPOINT_V07_ADDRESS: Address = '0x0000000071727De22E5E9d8BAf0edAc6f37da032';

/**
 * Common EntryPoint v0.8 address
 * Source: https://github.com/eth-infinitism/account-abstraction
 */
export const ENTRYPOINT_V08_ADDRESS: Address = '0x4337084d9e255ff0702461cf8895ce9e3b5ff108';

/**
 * Address representing native ETH in Uniswap V4
 */
export const ADDRESS_ZERO: Address = '0x0000000000000000000000000000000000000000';

/**
 * Universal Paymaster address
 */
export const PAYMASTER_ADDRESS: Address = '0x3BA9A96eE3eFf3A69E2B18886AcF52027EFF8966';
