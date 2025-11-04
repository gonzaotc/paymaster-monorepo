import { expect } from 'chai';
import hre from 'hardhat';
import { type Address, getContract } from 'viem';
import { uniswapPaymasterAbi } from '../generated/abis';
import { loadForgeArtifact } from '../src/helpers';
import { PERMIT2_ADDRESS, ENTRYPOINT_V08_ADDRESS } from '@uniswap-paymaster/sdk';

describe('UniswapPaymaster Deployment', function () {
	let paymasterAddress: Address;

	const POOL_MANAGER_ADDRESS = '0xE03A1074c86CFeDd5C142C4F04F1a1536e203543';

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
		expect(receipt.contractAddress).to.be.a('string');
		expect(receipt.status).to.equal('success');

		paymasterAddress = receipt.contractAddress!;
	});

	it('Should deploy, have correct constructor arguments and entryPoint reference', async function () {
		const [deployer] = await hre.viem.getWalletClients();
		const publicClient = await hre.viem.getPublicClient();

		const paymaster = getContract({
			address: paymasterAddress,
			abi: uniswapPaymasterAbi,
			client: { public: publicClient, wallet: deployer },
		});

		const managerAddress = await paymaster.read.manager();
		const permit2Address = await paymaster.read.permit2();
		const entryPoint = await paymaster.read.entryPoint();

		expect(managerAddress.toLowerCase()).to.equal(POOL_MANAGER_ADDRESS.toLowerCase());
		expect(permit2Address.toLowerCase()).to.equal(PERMIT2_ADDRESS.toLowerCase());
		expect(entryPoint.toLowerCase()).to.equal(ENTRYPOINT_V08_ADDRESS.toLowerCase());
	});
});
