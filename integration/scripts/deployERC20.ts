import hre from 'hardhat';
import { erc20MockAbi } from 'paymaster-sdk';
import { loadForgeArtifact } from '../src/helpers';

/**
 * Deploy the UniversalPaymaster contract to the selected chain
 */
async function main() {
	const [deployer] = await hre.viem.getWalletClients();
	const publicClient = await hre.viem.getPublicClient();

	const { bytecode } = loadForgeArtifact('MockERC20');

	const hash = await deployer.deployContract({
		abi: erc20MockAbi,
		bytecode,
		args: [],
	});

	console.log(`Transaction hash: ${hash}`);
	console.log('Waiting for confirmation...');

	// Wait for deployment
	const receipt = await publicClient.waitForTransactionReceipt({ hash });

	if (!receipt.contractAddress) {
		throw new Error('Deployment failed: no contract address in receipt');
	}

	console.log('\n✅ Deployment successful!');
	console.log(`ERC20 address: ${receipt.contractAddress}`);
	console.log(`Block number: ${receipt.blockNumber}`);
	console.log(`Gas used: ${receipt.gasUsed}`);
}

main()
	.then(() => process.exit(0))
	.catch((error) => {
		console.error(error);
		process.exit(1);
	});
