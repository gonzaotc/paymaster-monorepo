import { Address, createClient, http} from 'viem';
import { Chain } from 'viem/chains';
import { ADDRESS_ZERO } from './constants.js';
import { Pool } from './pool.js';

export interface Router {
	/**
	 * Finds the best pool for a given token, amount and chain.
	 * @param token - The token to find the best pool for.
	 * @param amount - The amount to find the best pool for.
	 * @param chain - The chain to find the pool on.
	 * @returns The best pool for the given token and amount.
	 */
	findBestPoolKey(token: Address, amount: bigint, chain: Chain): Promise<Pool>;
}

export const router: Router = {
	async findBestPoolKey(token: Address, amount: bigint, chain: Chain): Promise<Pool> {
		const client = createClient({ chain, transport: http() });

		const bestPoolMock: Pool = {
			token: token,
			oracle: ADDRESS_ZERO,
			lpFeeBps: 100, // 1%
			rebalancingFeeBps: 100, // 1%
		};

		return bestPoolMock;
	},
};
