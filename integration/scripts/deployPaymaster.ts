import hre from 'hardhat';
import { uniswapPaymasterAbi } from '../generated/abis';
import { loadForgeArtifact } from '../src/helpers';
import { getChainConfig } from '../src/config';
import { selectedChain } from '../hardhat.config';

/**
 * Deploy the UniswapPaymaster contract to the selected chain
 */
async function main() {
	const chainConfig = getChainConfig(selectedChain);
	const [deployer] = await hre.viem.getWalletClients();
	const publicClient = await hre.viem.getPublicClient();

	console.log(`Deploying UniswapPaymaster to ${chainConfig.name}...`);
	console.log(`Deployer address: ${deployer.account.address}`);
	console.log(`Pool Manager: ${chainConfig.POOL_MANAGER}`);
	console.log(`Permit2: ${chainConfig.PERMIT2}`);

	// Load the bytecode from Forge artifacts
	const { bytecode } = loadForgeArtifact('UniswapPaymaster');

	// Deploy the contract
	const hash = await deployer.deployContract({
		abi: uniswapPaymasterAbi,
		bytecode,
		args: [chainConfig.POOL_MANAGER, chainConfig.PERMIT2],
	});

	console.log(`Transaction hash: ${hash}`);
	console.log('Waiting for confirmation...');

	// Wait for deployment
	const receipt = await publicClient.waitForTransactionReceipt({ hash });

	if (!receipt.contractAddress) {
		throw new Error('Deployment failed: no contract address in receipt');
	}

	console.log('\n✅ Deployment successful!');
	console.log(`Paymaster address: ${receipt.contractAddress}`);
	console.log(`Block number: ${receipt.blockNumber}`);
	console.log(`Gas used: ${receipt.gasUsed}`);
}

main()
	.then(() => process.exit(0))
	.catch((error) => {
		console.error(error);
		process.exit(1);
	});

