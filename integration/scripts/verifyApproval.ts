import hre from 'hardhat';
import { erc20Abi, getContract, formatUnits } from 'viem';
import { getChainConfig } from '../src/config';

/**
 * Verify USDC approval of USER to Paymaster
 */
async function main() {
	const [chainConfig] = getChainConfig();
	const publicClient = await hre.viem.getPublicClient();

	const USDCContract = getContract({
		address: chainConfig.USDC,
		abi: erc20Abi,
		client: { public: publicClient },
	});

	const allowance = await USDCContract.read.allowance([
		chainConfig.USER_ADDRESS,
		chainConfig.PAYMASTER,
	]);

	console.log('USER address:', chainConfig.USER_ADDRESS);
	console.log('PAYMASTER address:', chainConfig.PAYMASTER);
	console.log('USDC allowance:', allowance.toString());
	console.log('USDC allowance (formatted):', formatUnits(allowance, 6));
}

main()
	.then(() => process.exit(0))
	.catch((error) => {
		console.error(error);
		process.exit(1);
	});
