import hre from 'hardhat';
import { universalPaymasterAbi } from 'paymaster-sdk';
import { getContract } from 'viem';
import { parseEther } from 'viem';
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

    const rebalanceAmount = parseEther('0.1');

    const mintedShares = await paymasterContract.write.rebalance([chainConfig.USDC, rebalanceAmount, chainConfig.REBALANCER_ADDRESS], { value: rebalanceAmount });
    console.log('minted shares: ', mintedShares);
}

main()
	.then(() => process.exit(0))
	.catch((error) => {
		console.error(error);
		process.exit(1);
	});

