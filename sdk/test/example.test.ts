// import {
// 	type Call,
// 	createClient,
// 	erc20Abi,
// 	getContract,
// 	parseUnits,
// 	publicActions,
// 	walletActions,
// 	http,
// } from 'viem';
// import { privateKeyToAccount } from 'viem/accounts';
// import { arbitrumSepolia } from 'viem/chains';
// import {
// 	createBundlerClient,
// 	BundlerClient,
// 	toSimple7702SmartAccount,
// } from 'viem/account-abstraction';
// import {
// 	paymaster,
// 	permit2,
// 	router,
// 	PAYMASTER_ADDRESS
// } from '../src/index';

// async function main() {
// 	const owner = privateKeyToAccount(PRIVATE_KEY);

// 	// create client
// 	const client = createClient({
// 		account: owner,
// 		chain: arbitrumSepolia,
// 		transport: http(),
// 	})
// 		.extend(publicActions)
// 		.extend(walletActions);

// 	// create account
// 	const account = await toSimple7702SmartAccount({
// 		client,
// 		owner,
// 	});

// 	// sign EIP-7702 authorization
// 	const authorization = await client.signAuthorization(account.authorization);

// 	const bundlerClient: BundlerClient = createBundlerClient({
// 		account,
// 		client,
// 		transport: http(BUNDLER_URL),
// 		// userOperation: {
// 		// 	estimateFeesPerGas: async ({ account, bundlerClient, userOperation }) => {
// 		// 		const { standard: fees } = await bundlerClient.request({
// 		// 			method: 'pimlico_getUserOperationGasPrice',
// 		// 		});
// 		// 		return {
// 		// 			maxFeePerGas: hexToBigInt(fees.maxFeePerGas),
// 		// 			maxPriorityFeePerGas: hexToBigInt(fees.maxPriorityFeePerGas),
// 		// 		};
// 		// 	},
// 		// },
// 	});

// 	// check user balance
// 	const usdc = getContract({ client, address: USDC_ADDRESS, abi: erc20Abi });
// 	const TX_USDC_COST = parseUnits('10', 6); // 10 USDC
// 	const usdcBalance = await usdc.read.balanceOf([account.address]);
// 	if (usdcBalance < TX_USDC_COST) {
// 		const errorMessage = `Fund ${account.address} with USDC on ${client.chain.name} using https://faucet.circle.com, then run this again.`;
// 		throw new Error(errorMessage);
// 	}

// 	// find the best pool to use
// 	const bestPoolKey = await router.findBestPoolKey(USDC_ADDRESS, TX_USDC_COST);

// 	// prepare permit2
// 	const permit2Single = permit2.buildPermit2Single(
// 		USDC_ADDRESS, // token (USDC)
// 		parseUnits('10', 6), // amount (10 USDC)
// 		PAYMASTER_ADDRESS, // spender (Paymaster)
// 		BigInt(Math.floor(Date.now() / 1000) + 86400), // sigDeadline (24 hours from now)
// 		0, // expiration (0)
// 		0 // nonce (0)
// 	);

// 	// sign permit2
// 	const permit2SingleSignature = await permit2.signPermit2Single(
// 		permit2Single,
// 		owner,
// 		client.chain.id
// 	);

// 	// prepare paymaster data
// 	const paymasterData = paymaster.buildPaymasterData({
// 		poolKey: bestPoolKey,
// 		permit: permit2Single,
// 		signature: permit2SingleSignature,
// 	});

// 	// prepare tx
// 	const tx: Call = {
// 		to: USDC_ADDRESS,
// 		abi: erc20Abi,
// 		functionName: 'transfer',
// 		args: ['0x{recipient}', parseUnits('10', 6)], // 10 USDC
// 	};

// 	// send user operation
// 	const hash = await bundlerClient.sendUserOperation({
// 		account,
// 		authorization,
// 		calls: [tx],
// 		paymaster: PAYMASTER_ADDRESS,
// 		paymasterData,
// 	});

// 	const receipt = await bundlerClient.waitForUserOperationReceipt({ hash });
// 	console.log('receipt', receipt);
// }

// main().catch(console.error);
