import hre from 'hardhat';
import { uniswapPaymasterAbi } from '../generated/abis';
import { loadForgeArtifact } from '../src/helpers';
import { PERMIT2_ADDRESS, router, paymaster, permit2 } from '@uniswap-paymaster/sdk';
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
import { privateKeyToAccount } from 'viem/accounts';
import { arbitrumSepolia } from 'viem/chains';
import {
	createBundlerClient,
	BundlerClient,
	toSimple7702SmartAccount,
} from 'viem/account-abstraction';

describe('Integration Test', function () {
	let paymasterAddress: Address;

	const POOL_MANAGER_ADDRESS = '0xE03A1074c86CFeDd5C142C4F04F1a1536e203543';
	const USDC_ADDRESS = '0x75faf114eafb1BDbe2F0316DF893fd58CE46AA4d';

	const BUNDLER_URL = process.env.BUNDLER_URL;
	const PRIVATE_KEY = process.env.PRIVATE_KEY;
	const RECIPIENT_ADDRESS = process.env.RECIPIENT_ADDRESS;
	const USDC_TRANSFER_AMOUNT = parseUnits('10', 6); // 10 USDC

	before(async function () {
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

	it('integration test', async function () {
		if (!PRIVATE_KEY || !RECIPIENT_ADDRESS || !BUNDLER_URL) {
			throw new Error('Missing environment variables');
		}

		const eoa = privateKeyToAccount(PRIVATE_KEY as `0x${string}`);
		console.log('created eoa');

		const client = createClient({
			account: eoa,
			chain: arbitrumSepolia,
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
			args: [RECIPIENT_ADDRESS as Address, USDC_TRANSFER_AMOUNT], // 10 USDC
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
