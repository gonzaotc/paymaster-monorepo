import hre from 'hardhat';
import { universalPaymasterAbi } from 'paymaster-sdk';
import { getContract } from 'viem';
import { getChainConfig } from '../src/config';

/**
 * Deploy the UniversalPaymaster contract to the selected chain
 */
async function main() {
    const [deployer] = await hre.viem.getWalletClients();
    const [chainConfig, ] = getChainConfig();
    const publicClient = await hre.viem.getPublicClient();

    const paymasterContract = getContract({
        address: chainConfig.PAYMASTER,
        abi: universalPaymasterAbi,
        client: { public: publicClient, wallet: deployer },
    });

    const hash = await paymasterContract.write.initializePool([chainConfig.USDC, 100, 100, chainConfig.ORACLE]);
    console.log('hash', hash);

    const pool = await paymasterContract.read.pools([chainConfig.USDC]);
    console.log('pool', pool);
}

main()
	.then(() => process.exit(0))
	.catch((error) => {
		console.error(error);
		process.exit(1);
	});

