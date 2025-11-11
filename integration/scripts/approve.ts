import hre from 'hardhat';
import { erc20Abi, getContract, maxUint256, createWalletClient, http } from 'viem';
import { privateKeyToAccount } from 'viem/accounts';
import { getChainConfig } from '../src/config';

/**
 * Approve USDC tokens for the paymaster
 */
async function main() {
	const [chainConfig, chain] = getChainConfig();
	const publicClient = await hre.viem.getPublicClient();

	const userAccount = privateKeyToAccount(chainConfig.USER_PRIVATE_KEY);
	const userWallet = createWalletClient({
		account: userAccount,
		chain,
		transport: http(),
	});

	const USDCContract = getContract({
		address: chainConfig.USDC,
		abi: erc20Abi,
		client: { public: publicClient, wallet: userWallet },
	});

	const hash = await USDCContract.write.approve([chainConfig.PAYMASTER, maxUint256]);
	console.log('Approval transaction hash:', hash);
	console.log('USER address:', chainConfig.USER_ADDRESS);
	console.log('PAYMASTER address:', chainConfig.PAYMASTER);
}

main()
	.then(() => process.exit(0))
	.catch((error) => {
		console.error(error);
		process.exit(1);
	});
