// import hre from 'hardhat';
// import { universalPaymasterAbi, router, paymaster, pool } from 'paymaster-sdk';
// import { loadForgeArtifact } from '../src/helpers';
// import {
// 	type Call,
// 	type Address,
// 	createClient,
// 	erc20Abi,
// 	getContract,
// 	parseUnits,
// 	publicActions,
// 	walletActions,
// 	http,
// } from 'viem';
// import { getChainConfig } from '../src/config';
// import { privateKeyToAccount } from 'viem/accounts';
// import { sepolia } from 'viem/chains';
// import {
// 	createBundlerClient,
// 	BundlerClient,
// 	toSimple7702SmartAccount,
// } from 'viem/account-abstraction';
// import { expect } from 'chai';

// describe('Integration Testnet Test', function () {
// 	let paymasterAddress: Address;

// 	const [chainConfig, selectedChain] = getChainConfig();

// 	const USDC_TRANSFER_AMOUNT = parseUnits('1', 6); // 10 USDC

// 	before('deploy paymaster', async function () {
// 		const [deployer] = await hre.viem.getWalletClients();
// 		const publicClient = await hre.viem.getPublicClient();

// 		const { bytecode } = loadForgeArtifact('UniversalPaymaster');
// 		const paymasterHash = await deployer.deployContract({
// 			abi: universalPaymasterAbi,
// 			bytecode,
// 			args: [],
// 		});
// 		const receipt = await publicClient.waitForTransactionReceipt({
// 			hash: paymasterHash,
// 		});

// 		paymasterAddress = receipt.contractAddress!;
// 		expect(paymasterAddress.length).to.equal(42);
// 	});

// 	it('Find & check [ETH, USDC] pool liquidity', async function () {
// 		const publicClient = await hre.viem.getPublicClient();
// 		const [deployer] = await hre.viem.getWalletClients();

// 		const paymasterContract = getContract({
// 			address: paymasterAddress,
// 			abi: universalPaymasterAbi,
// 			client: { public: publicClient, wallet: deployer },
// 		});

// 		const ethReserves = await paymasterContract.read.getPoolEthReserves([chainConfig.USDC]);
// 		console.log('ethReserves', ethReserves);
// 		expect(Number(ethReserves)).to.be.greaterThan(0);

// 		const tokenReserves = await paymasterContract.read.getPoolTokenReserves([chainConfig.USDC]);
// 		console.log('tokenReserves', tokenReserves);

// 		const pool = await paymasterContract.read.pools([chainConfig.USDC]);
// 		console.log('pool', pool);
// 	});

// 	// it('integration test', async function () {
// 	// 	const eoa = privateKeyToAccount(chainConfig.USER_PRIVATE_KEY);
// 	// 	console.log('created eoa');

// 	// 	const client = createClient({
// 	// 		account: eoa,
// 	// 		chain: sepolia,
// 	// 		transport: http(),
// 	// 	})
// 	// 		.extend(publicActions)
// 	// 		.extend(walletActions);
// 	// 	console.log('created client');

// 	// 	const account = await toSimple7702SmartAccount({
// 	// 		client,
// 	// 		owner: eoa,
// 	// 	});
// 	// 	console.log('created account:');

// 	// 	// const authorization = await client.signAuthorization(account.authorization);
// 	// 	// console.log('created authorization');

// 	// 	const bundlerClient: BundlerClient = createBundlerClient({
// 	// 		account,
// 	// 		client,
// 	// 		transport: http(chainConfig.BUNDLER_URL),
// 	// 	});
// 	// 	console.log('created bundler client');

// 	// 	const tx: Call = {
// 	// 		to: chainConfig.USDC,
// 	// 		abi: erc20Abi,
// 	// 		functionName: 'transfer',
// 	// 		args: [chainConfig.RECIPIENT_ADDRESS, USDC_TRANSFER_AMOUNT], // 10 USDC
// 	// 	};
// 	// 	console.log('created tx');

// 	// 	// estimate userOp
// 	// 	const gasInUsdc = parseUnits('1', 6);
// 	// 	const totalUsdcCost = gasInUsdc + USDC_TRANSFER_AMOUNT;
// 	// 	console.log('estimated gas in usdc');

// 	// 	// find the best pool to swap the USDC to ETH
// 	// 	const poolKey = await router.findBestPoolKey(chainConfig.USDC, totalUsdcCost);

// 	// 	// check user balance
// 	// 	// const usdc = getContract({ client, address: chainConfig.USDC, abi: erc20Abi });
// 	// 	// const usdcBalance = await usdc.read.balanceOf([account.address]);
// 	// 	// if (usdcBalance < totalUsdcCost) throw new Error('Insufficient USDC balance');
// 	// 	// console.log('checked usdc balance');

// 	// 	// prepare permit2
// 	// 	const permit2Nonce = 0;
// 	// 	const permit2Single = permit2.buildPermit2Single(
// 	// 		chainConfig.USDC,
// 	// 		totalUsdcCost,
// 	// 		paymasterAddress,
// 	// 		permit2Nonce
// 	// 	);
// 	// 	console.log('prepared permit2');

// 	// 	// sign permit2
// 	// 	const permit2SingleSignature = await permit2.signPermit2Single(
// 	// 		permit2Single,
// 	// 		eoa,
// 	// 		client.chain.id
// 	// 	);
// 	// 	console.log('signed permit2');

// 	// 	// prepare paymaster data
// 	// 	const paymasterData = paymaster.buildPaymasterData({
// 	// 		poolKey: poolKey,
// 	// 		permit: permit2Single,
// 	// 		signature: permit2SingleSignature,
// 	// 	});
// 	// 	console.log('prepared paymaster data');

// 	// 	console.log("preparing user operation");
// 	// 	console.log("account", account);
// 	// 	console.log("calls", [tx]);
// 	// 	console.log("paymaster", paymasterAddress);
// 	// 	console.log("paymasterData", paymasterData);
// 	// 	const userOperation = await bundlerClient.prepareUserOperation({
// 	// 		account,
// 	// 		calls: [tx],
// 	// 		paymaster: paymasterAddress,
// 	// 		paymasterData,
// 	// 	});
// 	// 	console.log('prepared user operation');
// 	// 	console.log('user operation', userOperation);

// 	// 	//send user operation
// 	// 	// const hash = await bundlerClient.sendUserOperation({
// 	// 	// 	account,
// 	// 	// 	authorization,
// 	// 	// 	calls: [tx],
// 	// 	// 	paymaster: paymasterAddress,
// 	// 	// 	paymasterData,
// 	// 	// });
// 	// 	// console.log('sent user operation');

// 	// 	// const receipt = await bundlerClient.waitForUserOperationReceipt({ hash });
// 	// 	// console.log('UserOperation receipt', receipt);
// 	// });
// });
