import { Address } from 'viem';

export type Pool = {
	token: Address;
	oracle: Address;
	lpFeeBps: number;
	rebalancingFeeBps: number;
};
