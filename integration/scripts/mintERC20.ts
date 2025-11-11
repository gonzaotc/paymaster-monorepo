import hre from 'hardhat';
import { erc20MockAbi } from 'paymaster-sdk';
import { getContract } from 'viem';
import { getChainConfig } from '../src/config';
import { parseEther } from 'viem';

/**
 * Mint ERC20 tokens to a user address
 */
async function main() {
	const [deployer] = await hre.viem.getWalletClients();
	const publicClient = await hre.viem.getPublicClient();
	const [chainConfig] = getChainConfig();

	console.log('FTC address:', chainConfig.FTC);
	console.log('User address:', chainConfig.USER_ADDRESS);
	console.log('Deployer address:', deployer.account.address);

	// Check if contract exists
	const code = await publicClient.getBytecode({ address: chainConfig.FTC });
	if (!code || code === '0x') {
		throw new Error(`No contract found at address ${chainConfig.FTC}. Did you deploy it?`);
	}
	console.log('Contract exists at address');
	console.log('Contract bytecode length:', code.length);

	const erc20Contract = getContract({
		address: chainConfig.FTC,
		abi: erc20MockAbi,
		client: { public: publicClient, wallet: deployer },
	});

	// Verify contract identity
	try {
		const name = await erc20Contract.read.name();
		const symbol = await erc20Contract.read.symbol();
		const decimals = await erc20Contract.read.decimals();
		const totalSupply = await erc20Contract.read.totalSupply();

		console.log('Contract name:', name);
		console.log('Contract symbol:', symbol);
		console.log('Token decimals:', decimals);
		console.log('Total supply:', totalSupply.toString());

		// If decimals is 0, this is NOT the expected ERC20Mock contract
		if (decimals === 0) {
			throw new Error(
				`Contract at ${chainConfig.FTC} returns 0 decimals. ` +
					`Expected ERC20Mock with 18 decimals. ` +
					`This might be the wrong contract address or a different contract type. ` +
					`Name: ${name}, Symbol: ${symbol}`
			);
		}
	} catch (error: any) {
		console.error('Failed to read contract metadata:', error);
		throw new Error(
			`Contract at ${chainConfig.FTC} doesn't match expected ERC20Mock ABI. Did you deploy the correct contract?`
		);
	}

	// Check current balance
	const balanceBefore = await erc20Contract.read.balanceOf([chainConfig.USER_ADDRESS]);
	console.log('Balance before mint:', balanceBefore.toString());

	// Use the correct amount based on decimals
	const decimals = await erc20Contract.read.decimals();
	const mintAmount = parseEther('100'); // This assumes 18 decimals
	console.log('Minting amount:', mintAmount.toString());

	// Try to simulate the mint first
	try {
		await publicClient.simulateContract({
			address: chainConfig.FTC,
			abi: erc20MockAbi,
			functionName: 'mint',
			args: [chainConfig.USER_ADDRESS, mintAmount],
			account: deployer.account,
		});
		console.log('Simulation successful - mint should work');
	} catch (simError: any) {
		console.error('Simulation failed:', simError);
		console.error('This means the mint will revert. Check the error above.');
		throw simError;
	}

	try {
		const hash = await erc20Contract.write.mint([chainConfig.USER_ADDRESS, mintAmount]);
		console.log('Mint transaction hash:', hash);

		// Wait for confirmation
		const receipt = await publicClient.waitForTransactionReceipt({ hash });
		console.log('Transaction confirmed in block:', receipt.blockNumber);

		// Check balance after
		const balanceAfter = await erc20Contract.read.balanceOf([chainConfig.USER_ADDRESS]);
		console.log('Balance after mint:', balanceAfter.toString());
	} catch (error: any) {
		console.error('Mint failed:', error);

		// Try to get more details about the revert
		if (error.data) {
			console.error('Revert data:', error.data);
		}
		if (error.reason) {
			console.error('Revert reason:', error.reason);
		}
		if (error.cause?.data) {
			console.error('Cause data:', error.cause.data);
		}
		throw error;
	}
}

main()
	.then(() => process.exit(0))
	.catch((error) => {
		console.error(error);
		process.exit(1);
	});
