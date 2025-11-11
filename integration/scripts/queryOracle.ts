import hre from 'hardhat';
import { oracleAbi } from 'paymaster-sdk';
import { getContract } from 'viem';
import { getChainConfig } from '../src/config';

/**
 * Deploy the UniversalPaymaster contract to the selected chain
 */
async function main() {
	const [chainConfig] = getChainConfig();
	const publicClient = await hre.viem.getPublicClient();

	const oracleContract = getContract({
		address: chainConfig.ORACLE,
		abi: oracleAbi,
		client: { public: publicClient },
	});

	const price = await oracleContract.read.getTokenPriceInEth();
	console.log('Price', price);
}

main()
	.then(() => process.exit(0))
	.catch((error) => {
		console.error(error);
		process.exit(1);
	});
