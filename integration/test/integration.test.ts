import hre from 'hardhat';
import { uniswapPaymasterAbi, poolManagerAbi, stateViewAbi } from '../generated/abis';
import { loadForgeArtifact } from '../src/helpers';
import { router, paymaster, permit2, ADDRESS_ZERO, PoolKey, uniswapV4 } from 'paymaster-sdk';
import {
	type Call,
	type Address,
	type Hex,
	createClient,
	erc20Abi,
	getContract,
	parseUnits,
	publicActions,
	walletActions,
	http,
} from 'viem';
import { privateKeyToAccount } from 'viem/accounts';
import { sepolia } from 'viem/chains';
import {
	createBundlerClient,
	BundlerClient,
	toSimple7702SmartAccount,
} from 'viem/account-abstraction';
import { SQRT_PRICE_1_4000 } from '../src/constants';
import { expect } from 'chai';

describe('Integration Test', function () {
	let paymasterAddress: Address;

	const RPC_URL = process.env.RPC_URL_SEPOLIA as string;
	const BUNDLER_URL = process.env.BUNDLER_URL_SEPOLIA as string;

	const ADDRESS = process.env.ADDRESS as Address;
	const PRIVATE_KEY = process.env.PRIVATE_KEY as Hex;
	const RECIPIENT_ADDRESS = process.env.RECIPIENT_ADDRESS as Address;

	const POOL_MANAGER_ADDRESS = process.env.POOL_MANAGER_SEPOLIA as Address;
	const PERMIT2_ADDRESS = process.env.PERMIT2_SEPOLIA as Address;
	const USDC_ADDRESS = process.env.USDC_SEPOLIA as Address;
	const STATE_VIEW_ADDRESS = process.env.STATE_VIEW_SEPOLIA as Address;

	if (
		!RPC_URL ||
		!BUNDLER_URL ||
		!ADDRESS ||
		!PRIVATE_KEY ||
		!RECIPIENT_ADDRESS ||
		!POOL_MANAGER_ADDRESS ||
		!STATE_VIEW_ADDRESS ||
		!PERMIT2_ADDRESS ||
		!USDC_ADDRESS
	) {
		throw new Error('Missing environment variables');
	}

	const USDC_TRANSFER_AMOUNT = parseUnits('10', 6); // 10 USDC

	before('deploy paymaster', async function () {
		const [deployer] = await hre.viem.getWalletClients();
		const publicClient = await hre.viem.getPublicClient();

		const { bytecode } = loadForgeArtifact('UniswapPaymaster');
		const paymasterHash = await deployer.deployContract({
			abi: uniswapPaymasterAbi,
			bytecode,
			args: [POOL_MANAGER_ADDRESS, PERMIT2_ADDRESS],
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
			address: POOL_MANAGER_ADDRESS,
			abi: poolManagerAbi,
			client: { public: publicClient, wallet: deployer },
		});

		// verify that the pool manager contract is deployed
        const poolManagerCode = await publicClient.getCode({
            address: POOL_MANAGER_ADDRESS,
        });
		expect(poolManagerCode?.length).to.be.greaterThan(20);

		const poolKey: PoolKey = {
			currency0: ADDRESS_ZERO,
			currency1: USDC_ADDRESS,
			fee: 1000,
			tickSpacing: 60,
			hooks: ADDRESS_ZERO,
		};

		await poolManager.write.initialize([poolKey, SQRT_PRICE_1_4000]);

		const stateView = getContract({
			address: STATE_VIEW_ADDRESS,
			abi: stateViewAbi,
			client: { public: publicClient, wallet: deployer },
		});

		const poolId = uniswapV4.toId(poolKey);

		// verify that the state view contract is deployed
        const stateViewCode = await publicClient.getCode({
            address: STATE_VIEW_ADDRESS,
        });
		expect(stateViewCode?.length).to.be.greaterThan(20);

		const liquidity = await stateView.read.getLiquidity([poolId]);
		console.log('liquidity', liquidity);
	});

	it('test initialized pool', async function () {
		// const [deployer] = await hre.viem.getWalletClients();
		// const publicClient = await hre.viem.getPublicClient();
		// const poolManager = getContract({
		// 	address: POOL_MANAGER_ADDRESS,
		// 	abi: poolManagerAbi,
		// 	client: { public: publicClient, wallet: deployer },
		// });
		// const poolKey = await poolManager.read.poolKey();
		// console.log('pool key', poolKey);
	});

	it.skip('integration test', async function () {
		const eoa = privateKeyToAccount(PRIVATE_KEY);
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
			transport: http(BUNDLER_URL),
			// userOperation: {}
		});
		console.log('created bundler client');

		const tx: Call = {
			to: USDC_ADDRESS,
			abi: erc20Abi,
			functionName: 'transfer',
			args: [RECIPIENT_ADDRESS, USDC_TRANSFER_AMOUNT], // 10 USDC
		};
		console.log('created tx');

		// estimate userOp
		const gasInUsdc = parseUnits('1', 6);
		const totalUsdcCost = gasInUsdc + USDC_TRANSFER_AMOUNT;
		console.log('estimated gas in usdc');

		// check user balance
		const usdc = getContract({ client, address: USDC_ADDRESS, abi: erc20Abi });
		const usdcBalance = await usdc.read.balanceOf([account.address]);
		if (usdcBalance < totalUsdcCost) throw new Error('Insufficient USDC balance');
		console.log('checked usdc balance');

		// find the best pool to swap the USDC to ETH
		const bestPoolKey = await router.findBestPool(USDC_ADDRESS, totalUsdcCost);
		console.log('found best pool key');

		// prepare permit2
		// @tbd research the permit2 nonce
		const permit2Nonce = 0;
		const permit2Single = permit2.buildPermit2Single(
			USDC_ADDRESS,
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
