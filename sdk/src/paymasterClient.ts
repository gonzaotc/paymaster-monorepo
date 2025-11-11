import { encodeAbiParameters, parseAbiParameters, type Address } from 'viem';
import { BundlerClientConfig } from 'viem/account-abstraction';
import type {
	GetPaymasterDataParameters,
	GetPaymasterStubDataParameters,
} from 'viem/account-abstraction';
import { PAYMASTER_ADDRESS, } from './constants.js';

// Define the ABI parameters for encoding
const paymasterDataParams = parseAbiParameters('address token');

// Define the context type that apps can pass to customize paymaster behavior
export interface PaymasterContext {
    token: Address;
}

export const paymasterClient: BundlerClientConfig['paymaster'] = {
	async getPaymasterStubData(params: GetPaymasterStubDataParameters) {
		const context = params.context as PaymasterContext | undefined;

		if (!context) throw new Error('No context passed to paymaster');
		if (!context.token) throw new Error('No token passed to paymaster');
		
		// Encode the paymaster data
		const paymasterData = encodeAbiParameters(paymasterDataParams, [
			context.token,
		]);

		return {
			paymaster: PAYMASTER_ADDRESS,
			paymasterData,
			// Use conservative estimates that are high enough to cover actual usage
			// Setting isFinal: true means viem won't re-estimate, so these must be sufficient
			paymasterVerificationGasLimit: 150_000n, // Increased to be safe
			paymasterPostOpGasLimit: 100_000n, // Increased to be safe
			sponsor: {
				name: 'UniswapPaymaster',
				icon: 'https://uniswap.org/logo.png',
			},
			isFinal: true, // Tell Viem this is final - don't re-estimate
		};
	},

	async getPaymasterData(params: GetPaymasterDataParameters) {
		const context = params.context as PaymasterContext | undefined;
		if (!context) throw new Error('No context passed to paymaster');
		if (!context.token) throw new Error('No token passed to paymaster');
		
		const paymasterData = encodeAbiParameters(paymasterDataParams, [
			context.token,
		]);

		return {
			paymaster: PAYMASTER_ADDRESS,
			paymasterData,
			// Use the same gas limits from stub to ensure consistency
			// Since isFinal: true, these should match the stub
			paymasterVerificationGasLimit: 150_000n,
			paymasterPostOpGasLimit: 100_000n,
		};
	},
};
