import { encodeAbiParameters } from 'viem';
import type { Address, Hex } from 'viem';
export type PaymasterData = {
	token: Address;
};

export const paymaster = {
	/**
	 * Builds the paymaster data for the UniversalPaymaster contract.
	 * @param params - The parameters for the paymaster data.
	 * @returns The paymaster data.
	 */
	buildPaymasterData: (params: PaymasterData): Hex => {
		const { token } = params;
		return encodeAbiParameters([{ type: 'address' }], [token]);
	},
};
