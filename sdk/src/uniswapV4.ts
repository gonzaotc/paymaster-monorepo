
import { Address, encodeAbiParameters, Hash, keccak256 } from 'viem';

/**
 * The pool key for a Uniswap V4 pool.
 * @param currency0 - The address of the first currency.
 * @param currency1 - The address of the second currency.
 * @param fee - The fee of the pool.
 * @param tickSpacing - The tick spacing of the pool.
 * @param hooks - The address of the hooks contract.
 */
export type PoolKey = {
	currency0: Address;
	currency1: Address;
	fee: number;
	tickSpacing: number;
	hooks: Address;
};

interface UniswapV4 {
    /**
     * Converts a pool key to a pool id.
     * @param poolKey - The pool key to convert.
     * @returns The pool id.
     */
    toId(poolKey: PoolKey): Hash;
}

export const uniswapV4: UniswapV4 = {
    toId(poolKey: PoolKey): Hash {
        const encoded = encodeAbiParameters(
            [
                { type: 'address' },
                { type: 'address' },
                { type: 'uint24' },
                { type: 'int24' },
                { type: 'address' }
            ],
            [
                poolKey.currency0,
                poolKey.currency1,
                poolKey.fee,
                poolKey.tickSpacing,
                poolKey.hooks
            ]
        );
        return keccak256(encoded);
    }
}