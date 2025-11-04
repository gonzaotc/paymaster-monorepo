import hre from 'hardhat';
import { uniswapPaymasterAbi, poolManagerAbi } from '../generated/abis';
import { loadForgeArtifact } from '../src/helpers';
import { router, paymaster, permit2, ADDRESS_ZERO, PoolKey } from 'paymaster-sdk';
import {
	type Call,
	type Address,
	createClient,
	erc20Abi,
	getContract,
	parseUnits,
	publicActions,
	walletActions,
	http,
} from 'viem';
import { getChainConfig } from '../src/config';
import { privateKeyToAccount } from 'viem/accounts';
import { sepolia } from 'viem/chains';
import {
	createBundlerClient,
	BundlerClient,
	toSimple7702SmartAccount,
} from 'viem/account-abstraction';
import { SQRT_PRICE_1_4000 } from '../src/constants';
import { expect } from 'chai';
import { selectedChain } from '../hardhat.config';

describe('Integration Test', function () {
	let paymasterAddress: Address;

	const chainConfig = getChainConfig(selectedChain);

	const poolKey: PoolKey = {
		currency0: ADDRESS_ZERO,
		currency1: chainConfig.USDC,
		fee: 1000,
		tickSpacing: 60,
		hooks: ADDRESS_ZERO,
	};

	const USDC_TRANSFER_AMOUNT = parseUnits('10', 6); // 10 USDC

	before('deploy paymaster', async function () {
		const [deployer] = await hre.viem.getWalletClients();
		const publicClient = await hre.viem.getPublicClient();

		const { bytecode } = loadForgeArtifact('UniswapPaymaster');
		const paymasterHash = await deployer.deployContract({
			abi: uniswapPaymasterAbi,
			bytecode,
			args: [chainConfig.POOL_MANAGER, chainConfig.PERMIT2],
		});
		const receipt = await publicClient.waitForTransactionReceipt({
			hash: paymasterHash,
		});

		paymasterAddress = receipt.contractAddress!;
	});

	before('create [ETH, USDC] pool', async function () {
		const [deployer] = await hre.viem.getWalletClients();
		const publicClient = await hre.viem.getPublicClient();

		const poolManager = getContract({
			address: chainConfig.POOL_MANAGER,
			abi: poolManagerAbi,
			client: { public: publicClient, wallet: deployer },
		});

		// verify that the pool manager contract is deployed
		const poolManagerCode = await publicClient.getCode({
			address: chainConfig.POOL_MANAGER,
		});
		expect(poolManagerCode?.length).to.be.greaterThan(20);

		await poolManager.write.initialize([poolKey, SQRT_PRICE_1_4000]);
		console.log('created [ETH, USDC] pool');
	});

	before('Add [ETH, USDC] liquidity', async function () {
		const publicClient = await hre.viem.getPublicClient();

		// impersonate USDC whale
		await hre.network.provider.request({
			method: 'hardhat_impersonateAccount',
			params: [chainConfig.USDC_WHALE],
		});

		// Get whale client
		const whaleClient = await hre.viem.getWalletClient(chainConfig.USDC_WHALE);

		// check whale eth balance
		const ethBalance = await publicClient.getBalance({
			address: whaleClient.account.address,
		});
		console.log('whale ETH balance:', ethBalance);

		// check whale usdc balance
		const usdcBalance = await publicClient.readContract({
			address: chainConfig.USDC,
			abi: erc20Abi,
			functionName: 'balanceOf',
			args: [whaleClient.account.address],
		});
		console.log('whale USDC balance:', usdcBalance);

		// Add liquidity

		// const stateView = getContract({
		// 	address: chainConfig.STATE_VIEW,
		// 	abi: stateViewAbi,
		// 	client: { public: publicClient, wallet: deployer },
		// });

		// const poolId = uniswapV4.toId(poolKey);

		// // verify that the state view contract is deployed
		// const stateViewCode = await publicClient.getCode({
		// 	address: chainConfig.STATE_VIEW,
		// });
		// expect(stateViewCode?.length).to.be.greaterThan(20);

		// const liquidity = await stateView.read.getLiquidity([poolId]);
		// console.log('liquidity', liquidity);
	});

	it.skip('integration test', async function () {
		const eoa = privateKeyToAccount(chainConfig.PRIVATE_KEY);
		console.log('created eoa');

		const client = createClient({
			account: eoa,
			chain: sepolia,
			transport: http(),
		})
			.extend(publicActions)
			.extend(walletActions);
		console.log('created client');

		const account = await toSimple7702SmartAccount({
			client,
			owner: eoa,
		});
		console.log('created account');

		const authorization = await client.signAuthorization(account.authorization);
		console.log('created authorization');

		const bundlerClient: BundlerClient = createBundlerClient({
			account,
			client,
			transport: http(chainConfig.BUNDLER_URL),
		});
		console.log('created bundler client');

		const tx: Call = {
			to: chainConfig.USDC,
			abi: erc20Abi,
			functionName: 'transfer',
			args: [chainConfig.RECIPIENT_ADDRESS, USDC_TRANSFER_AMOUNT], // 10 USDC
		};
		console.log('created tx');

		// estimate userOp
		const gasInUsdc = parseUnits('1', 6);
		const totalUsdcCost = gasInUsdc + USDC_TRANSFER_AMOUNT;
		console.log('estimated gas in usdc');

		// check user balance
		const usdc = getContract({ client, address: chainConfig.USDC, abi: erc20Abi });
		const usdcBalance = await usdc.read.balanceOf([account.address]);
		if (usdcBalance < totalUsdcCost) throw new Error('Insufficient USDC balance');
		console.log('checked usdc balance');

		// find the best pool to swap the USDC to ETH
		const bestPoolKey = await router.findBestPool(chainConfig.USDC, totalUsdcCost);
		console.log('found best pool key');

		// prepare permit2
		// @tbd research the permit2 nonce
		const permit2Nonce = 0;
		const permit2Single = permit2.buildPermit2Single(
			chainConfig.USDC,
			USDC_TRANSFER_AMOUNT,
			paymasterAddress,
			permit2Nonce
		);
		console.log('prepared permit2');

		// sign permit2
		const permit2SingleSignature = await permit2.signPermit2Single(
			permit2Single,
			eoa,
			client.chain.id
		);
		console.log('signed permit2');

		// prepare paymaster data
		const paymasterData = paymaster.buildPaymasterData({
			poolKey: bestPoolKey,
			permit: permit2Single,
			signature: permit2SingleSignature,
		});
		console.log('prepared paymaster data');

		// send user operation
		const hash = await bundlerClient.sendUserOperation({
			account,
			authorization,
			calls: [tx],
			paymaster: paymasterAddress,
			paymasterData,
		});
		console.log('sent user operation');

		const receipt = await bundlerClient.waitForUserOperationReceipt({ hash });
		console.log('UserOperation receipt', receipt);
	});
});
