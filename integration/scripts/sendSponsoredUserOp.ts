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
} from 'viem';
import { paymaster } from 'paymaster-sdk';

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
		args: [chainConfig.RECIPIENT_ADDRESS, USDC_TRANSFER_AMOUNT], // 10 USDC
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
	console.log('built paymaster data');

	console.log('sending user operation');
	const hash = await bundlerClient.sendUserOperation({
		account,
		authorization,
		calls: [tx],
		paymaster: chainConfig.PAYMASTER,
		paymasterData,
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
