import { encodeAbiParameters } from 'viem';
import type { Address, Hex } from 'viem';
import type { PermitSingle } from '@gonzaotc/permit2-sdk-viem';

export type PoolKey = {
	currency0: Address;
	currency1: Address;
	fee: number;
	tickSpacing: number;
	hooks: Address;
};

export type PaymasterData = {
	poolKey: PoolKey;
	permit: PermitSingle;
	signature: Hex;
};

export const paymaster = {
	/**
	 * Builds the paymaster data for the UniswapPaymaster contract.
	 * @param params - The parameters for the paymaster data.
	 * @returns The paymaster data.
	 */
	buildPaymasterData: (params: PaymasterData): Hex => {
		const { poolKey, permit, signature } = params;
		const paymasterData = encodeAbiParameters(
			[
				{
					type: 'tuple',
					components: [
						{ name: 'currency0', type: 'address' },
						{ name: 'currency1', type: 'address' },
						{ name: 'fee', type: 'uint24' },
						{ name: 'tickSpacing', type: 'int24' },
						{ name: 'hooks', type: 'address' },
					],
				},
				{
					type: 'tuple',
					components: [
						{
							name: 'details',
							type: 'tuple',
							components: [
								{ name: 'token', type: 'address' },
								{ name: 'amount', type: 'uint160' },
								{ name: 'expiration', type: 'uint48' },
								{ name: 'nonce', type: 'uint48' },
							],
						},
						{ name: 'spender', type: 'address' },
						{ name: 'sigDeadline', type: 'uint256' },
					],
				},
				{ type: 'bytes' },
			],
			[poolKey, permit, signature]
		);

		return paymasterData;
	},
};
