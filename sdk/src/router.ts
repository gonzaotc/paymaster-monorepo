import { Address } from 'viem';
import type { PoolKey } from './uniswapV4';
import { ADDRESS_ZERO } from './constants';

export interface Router {
	/**
	 * Finds the best pool for a given token and amount.
	 * @param token - The token to find the best pool for.
	 * @param amount - The amount to find the best pool for.
	 * @returns The best pool for the given token and amount.
	 */
	findBestPool(token: Address, amount: bigint): Promise<PoolKey>;
}

export const router: Router = {
	// eslint-disable-next-line @typescript-eslint/no-unused-vars
	async findBestPool(token: Address, amount: bigint): Promise<PoolKey> {
		const bestPoolMock: PoolKey = {
			currency0: ADDRESS_ZERO,
			currency1: token,
			fee: 1000,
			tickSpacing: 60,
			hooks: ADDRESS_ZERO,
		};

		return bestPoolMock;
	},
};
