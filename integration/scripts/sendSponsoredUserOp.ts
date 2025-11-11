import { getChainConfig } from '../src/config';
import {
	BundlerClient,
	createBundlerClient,
	toSimple7702SmartAccount,
} from 'viem/account-abstraction';
import { privateKeyToAccount } from 'viem/accounts';
import {
	createClient,
	publicActions,
	walletActions,
	http,
	erc20Abi,
	parseUnits,
	type Call,
	getContract,
} from 'viem';
import { paymaster, paymasterClient, universalPaymasterAbi } from 'paymaster-sdk';
import { Address } from 'viem';

/**
 * Convert the EOA into a Simple Smart Account via EIP-7702 signatures.
 * Sign an approve for the paymaster if needed.
 * => later will be permit1/permit2 gasless signatures.
 * Send a user operation that transfers the USDC to the paymaster.
 * Uses the given decentralized paymaster address and context.
 * Uses the given bundler rpc url.
 */
async function main() {
	const [chainConfig, chain] = getChainConfig();

	const USDC_TRANSFER_AMOUNT = parseUnits('1', 6); // 1 USDC

	const eoa = privateKeyToAccount(chainConfig.USER_PRIVATE_KEY);
	console.log('generated eoa');

	const client = createClient({
		account: eoa,
		chain,
		transport: http(),
	})
		.extend(publicActions)
		.extend(walletActions);
	console.log('generated client');

	const account = await toSimple7702SmartAccount({
		client,
		owner: eoa,
	});
	console.log('generated account');

	// Check if the EOA has already been delegated via EIP-7702
	// EIP-7702 delegation code starts with 0xef0100 (magic prefix + version)
	const code = await client.getCode({ address: eoa.address });
	console.log('eoa code', code);
	const isDelegated = code !== undefined && code.startsWith('0xef0100');

	let authorization;
	if (isDelegated) {
		console.log('account already delegated via EIP-7702, skipping authorization');
		authorization = undefined;
	} else {
		console.log('account not yet delegated, creating authorization');
		authorization = await client.signAuthorization(account.authorization);
		console.log('created authorization');
	}

	const bundlerClient: BundlerClient = createBundlerClient({
		account,
		client,
		transport: http(chainConfig.BUNDLER_URL),
	});
	console.log('generated bundler client');

	const tx: Call = {
		to: chainConfig.USDC,
		abi: erc20Abi,
		functionName: 'transfer',
		args: [chainConfig.RECIPIENT_ADDRESS, USDC_TRANSFER_AMOUNT], // 1
	};
	console.log('generated tx');

	// console.log('finding best pool key for params');
	// console.log('token', chainConfig.USDC);
	// const poolKey = await router.findBestPoolKey(chainConfig.USDC, totalUsdcCost, chain);
	// console.log('found pool key');

	// prepare paymaster data
	const paymasterData = paymaster.buildPaymasterData({
		token: chainConfig.USDC,
	});
	console.log('built paymaster data', paymasterData);
	console.log('paymaster data length (bytes):', paymasterData.length / 2 - 1); // -1 for '0x'

	const paymasterContract = getContract({
		address: chainConfig.PAYMASTER,
		abi: universalPaymasterAbi,
		client: { public: client },
	});
	const pool = await paymasterContract.read.pools([chainConfig.USDC]);
	console.log('Paymaster contract', paymasterContract.address);
	console.log('Pool', pool);

	// Approve the paymaster to spend tokens (required for paymaster validation)
	const usdcContract = getContract({
		address: chainConfig.USDC,
		abi: erc20Abi,
		client,
	});

	const currentAllowance = await usdcContract.read.allowance([eoa.address, chainConfig.PAYMASTER]);
	console.log('current allowance', currentAllowance);

	// Check user's token balance
	const userBalance = await usdcContract.read.balanceOf([eoa.address]);
	console.log('User USDC balance:', userBalance.toString());

	// Get pool info to calculate prefund
	const poolInfo = await paymasterContract.read.pools([chainConfig.USDC]);
	const oracleAddress = poolInfo[1] as Address;

	// Get oracle contract (you'll need to import or define the oracle ABI)
	// For now, let's just log what we know
	console.log('Oracle address:', oracleAddress);

	if (currentAllowance === 0n) {
		console.log('Approving paymaster to spend tokens...');
		const approveHash = await usdcContract.write.approve([
			chainConfig.PAYMASTER,
			parseUnits('1000000', 6), // Approve a large amount
		]);
		await client.waitForTransactionReceipt({ hash: approveHash });
		console.log('Approved paymaster');
	}

	// Verify the oracle is callable
	const oracleContract = getContract({
		address: poolInfo[1] as Address,
		abi: [
			{
				name: 'getTokenPriceInEth',
				type: 'function',
				inputs: [],
				outputs: [{ type: 'uint256' }],
				stateMutability: 'view',
			},
		],
		client: { public: client },
	});

	try {
		const tokenPrice = await oracleContract.read.getTokenPriceInEth();
		console.log('Oracle token price:', tokenPrice.toString());
	} catch (error) {
		console.error('Oracle call failed:', error);
		throw new Error("Oracle is not callable - check if it's deployed and working");
	}

	// Check pool ETH reserves
	const poolEthReserves = await paymasterContract.read.getPoolEthReserves([chainConfig.USDC]);
	console.log('Pool ETH reserves (wei):', poolEthReserves.toString());

	// Calculate approximate maxCost based on gas limits
	// maxCost = (callGasLimit + paymasterVerificationGasLimit + paymasterPostOpGasLimit + preVerificationGas) * maxFeePerGas
	const estimatedTotalGas = 17955n + 51698n + 50000n + 50356n; // From the error log
	const maxFeePerGasWei = parseUnits('0.000002026', 18); // From error log
	const estimatedMaxCost = estimatedTotalGas * maxFeePerGasWei;
	console.log('Estimated maxCost (wei):', estimatedMaxCost.toString());
	console.log('Pool has enough ETH?', poolEthReserves >= estimatedMaxCost);

	if (poolEthReserves < estimatedMaxCost) {
		console.error(
			`Pool only has ${poolEthReserves.toString()} wei but needs at least ${estimatedMaxCost.toString()} wei`
		);
		console.error('You need to deposit ETH into the pool first!');
		process.exit(1);
	}

	console.log('sending user operation');
	const hash = await bundlerClient.sendUserOperation({
		account,
		authorization,
		calls: [tx],
		// paymaster: chainConfig.PAYMASTER,
		// paymasterData,
		paymaster: paymasterClient,
		paymasterContext: {
			token: chainConfig.USDC,
		},
	});
	console.log('sent user operation');

	const receipt = await bundlerClient.waitForUserOperationReceipt({ hash });
	console.log('UserOperation receipt', receipt);
}

main()
	.then(() => process.exit(0))
	.catch((error) => {
		console.error(error);
		process.exit(1);
	});
