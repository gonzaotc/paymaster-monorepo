import { Address, createClient, http } from 'viem';
import { uniswapV4, type PoolKey } from './uniswapV4.js';
import { ADDRESS_ZERO } from './constants.js';
import { getContract } from 'viem';
import { Chain } from 'viem/chains';
import { stateViewAbi } from './generated/abis.js';

export interface Router {
	/**
	 * Finds the best pool for a given token, amount and chain.
	 * @param token - The token to find the best pool for.
	 * @param amount - The amount to find the best pool for.
	 * @param chain - The chain to find the pool on.
	 * @returns The best pool for the given token and amount.
	 */
	findBestPoolKey(token: Address, amount: bigint, chain: Chain): Promise<PoolKey>;
}

export const router: Router = {
	async findBestPoolKey(token: Address, amount: bigint, chain: Chain): Promise<PoolKey> {
		const client = createClient({chain, transport: http(),})

		const bestPoolMock: PoolKey = {
			currency0: ADDRESS_ZERO,
			currency1: token,
			fee: 3000, // 0.3%
			tickSpacing: 60,
			hooks: ADDRESS_ZERO,
		};
		console.log('bestPoolMock', bestPoolMock);

		const poolId = uniswapV4.toId(bestPoolMock);
		console.log('poolId', poolId);
	
		const stateView = getContract({
			// @TBD organize this in a better way
			address: '0xc199f1072a74d4e905aba1a84d9a45e2546b6222' as Address,
			abi: stateViewAbi,
			client: { public: client },
		});
	
		const liquidity = await stateView.read.getLiquidity([poolId]);
		console.log('liquidit in pool', liquidity);
		if (Number(liquidity) <= 0) throw new Error('No liquidity found in determined pool');

		return bestPoolMock;
	},
};
