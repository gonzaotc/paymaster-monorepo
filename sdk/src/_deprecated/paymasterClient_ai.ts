// import { encodeAbiParameters, Hex, parseUnits, parseAbiParameters } from 'viem';
// import { BundlerClientConfig } from 'viem/account-abstraction';
// import type {
// 	GetPaymasterDataParameters,
// 	GetPaymasterStubDataParameters,
// } from 'viem/account-abstraction';
// // import { signPermit } from './permit'; // Will be needed when implementing Permit2
// import type { Address } from 'viem';
// import { PAYMASTER_ADDRESS, USDC_ADDRESS, ADDRESS_ZERO } from './constants';

// /**
//  * UniswapPaymaster expects: (PoolKey, IAllowanceTransfer.permit, bytes signature)
//  *
//  * PoolKey structure (from Uniswap V4):
//  * - currency0: address (native ETH = address(0))
//  * - currency1: address (the ERC20 token, e.g. USDC)
//  * - fee: uint24
//  * - tickSpacing: int24
//  * - hooks: address
//  *
//  * IAllowanceTransfer.permit structure (from Permit2):
//  * - details: { token, amount, expiration, nonce }
//  * - spender: address
//  * - sigDeadline: uint256
//  */

// // Define the ABI parameters for encoding
// const paymasterDataParams = parseAbiParameters(
// 	[
// 		'(address currency0, address currency1, uint24 fee, int24 tickSpacing, address hooks) poolKey',
// 		'((address token, uint160 amount, uint48 expiration, uint48 nonce) details, address spender, uint256 sigDeadline) permit',
// 		'bytes signature',
// 	].join(',')
// );

// // Example pool configuration - USERS SHOULD CUSTOMIZE THIS
// const EXAMPLE_POOL_KEY = {
// 	currency0: ADDRESS_ZERO, // Native ETH
// 	currency1: USDC_ADDRESS, // USDC token
// 	fee: 3000, // 0.3% fee tier
// 	tickSpacing: 60,
// 	hooks: ADDRESS_ZERO, // No hooks for this pool
// };

// // Define the context type that apps can pass to customize paymaster behavior
// export interface PaymasterContext {
// 	permitAmount?: string; // Amount in token units (e.g., "10" for 10 USDC)
// 	poolKey?: {
// 		currency0: Address;
// 		currency1: Address;
// 		fee: number;
// 		tickSpacing: number;
// 		hooks: Address;
// 	};
// }

// export const paymaster: BundlerClientConfig['paymaster'] = {
// 	async getPaymasterStubData(params: GetPaymasterStubDataParameters) {
// 		// Extract context passed from the app
// 		const context = params.context as PaymasterContext | undefined;

// 		// Use context values or fall back to defaults
// 		const _permitAmount = context?.permitAmount
// 			? parseUnits(context.permitAmount, 6) // USDC has 6 decimals
// 			: parseUnits('10', 6); // Default to 10 USDC

// 		const _poolKey = context?.poolKey || EXAMPLE_POOL_KEY;

// 		// Create a stub permit structure with realistic data
// 		const stubPermit = {
// 			details: {
// 				token: _poolKey.currency1, // Use the token from the selected pool
// 				amount: _permitAmount,
// 				expiration: BigInt(Math.floor(Date.now() / 1000) + 86400), // 24h from now
// 				nonce: 0n, // Stub nonce
// 			},
// 			spender: PAYMASTER_ADDRESS,
// 			sigDeadline: BigInt(2n ** 48n - 1n), // Max deadline
// 		};

// 		// Create a FAKE signature (65 bytes of zeros)
// 		// Must be same length as real signature for accurate gas estimation
// 		const stubSignature = ('0x' + '00'.repeat(65)) as Hex;

// 		// Encode the paymaster data
// 		const paymasterData = encodeAbiParameters(paymasterDataParams, [
// 			_poolKey,
// 			stubPermit,
// 			stubSignature,
// 		]);

// 		return {
// 			paymaster: PAYMASTER_ADDRESS,
// 			paymasterData,
// 			// These are estimates - bundler will refine them
// 			paymasterVerificationGasLimit: 500_000n, // High because of Uniswap swap
// 			paymasterPostOpGasLimit: 50_000n, // For refund + EntryPoint deposit
// 			sponsor: {
// 				name: 'UniswapPaymaster',
// 				icon: 'https://uniswap.org/logo.png',
// 			},
// 			isFinal: false, // Tell Viem to estimate again with this stub data
// 		};
// 	},

// 	/**
// 	 * Step 2: Provide REAL data for actual UserOp submission
// 	 * This is called after gas estimation, right before sending
// 	 */
// 	async getPaymasterData(params: GetPaymasterDataParameters) {
// 		// Extract context passed from the app (same as in stub)
// 		const context = params.context as PaymasterContext | undefined;

// 		// Use context values or fall back to defaults
// 		const _permitAmount = context?.permitAmount
// 			? parseUnits(context.permitAmount, 6) // USDC has 6 decimals
// 			: parseUnits('10', 6); // Default to 10 USDC

// 		const _poolKey = context?.poolKey || EXAMPLE_POOL_KEY;

// 		// TODO: You need to implement Permit2 signature generation
// 		// This is different from EIP-2612!
// 		// For now, throwing an error to show what's needed
// 		throw new Error(
// 			'Permit2 signature generation not yet implemented. ' +
// 				'Your UniswapPaymaster uses Permit2 (IAllowanceTransfer), ' +
// 				'not EIP-2612. You need to implement signPermit2() function.'
// 		);

// 		// This is what you SHOULD do (after implementing signPermit2):
// 		/*
// 		const realPermit = {
// 			details: {
// 				token: _poolKey.currency1,
// 				amount: _permitAmount,
// 				expiration: BigInt(Math.floor(Date.now() / 1000) + 86400),
// 				nonce: await getPermit2Nonce(params.account.address, _poolKey.currency1),
// 			},
// 			spender: PAYMASTER_ADDRESS,
// 			sigDeadline: BigInt(2n ** 48n - 1n),
// 		};

// 		// Generate REAL Permit2 signature
// 		const realSignature = await signPermit2({
// 			account: params.account,
// 			permit: realPermit,
// 		});

// 		const paymasterData = encodeAbiParameters(paymasterDataParams, [
// 			_poolKey,
// 			realPermit,
// 			realSignature,
// 		]);

// 		return {
// 			paymaster: PAYMASTER_ADDRESS,
// 			paymasterData,
// 			// Use the estimated gas limits from the stub estimation
// 			paymasterVerificationGasLimit: params.userOperation.paymasterVerificationGasLimit || 500_000n,
// 			paymasterPostOpGasLimit: params.userOperation.paymasterPostOpGasLimit || 50_000n,
// 		};
// 		*/
// 	},
// };
