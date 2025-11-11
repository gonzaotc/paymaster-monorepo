import hre from 'hardhat';
import { universalPaymasterAbi } from 'paymaster-sdk';
import { getContract } from 'viem';
import { getChainConfig } from '../src/config';

/**
 * Deploy the UniversalPaymaster contract to the selected chain
 */
async function main() {
	const [deployer] = await hre.viem.getWalletClients();
	const [chainConfig] = getChainConfig();
	const publicClient = await hre.viem.getPublicClient();

	const paymasterContract = getContract({
		address: chainConfig.PAYMASTER,
		abi: universalPaymasterAbi,
		client: { public: publicClient, wallet: deployer },
	});

    const tokensReserve = await paymasterContract.read.getPoolTokenReserves([chainConfig.USDC]);
    console.log('tokens reserve: ', tokensReserve);

    if (tokensReserve === 0n) {
        console.error('tokens reserve is 0');
        return;
    }
    
    // @TO-DO: a quoting mechanism to know the exact amount of eth to send
    // for now, we know that the token-to-eth ratio is 1:1, so we send the
    // exact amount of eth as the token reserve
	const ethAmountPaid = await paymasterContract.write.rebalance(
		[chainConfig.USDC, tokensReserve, chainConfig.REBALANCER_ADDRESS],
		{ value: tokensReserve }
	);

	console.log('eth amount paid: ', ethAmountPaid);
}

main()
	.then(() => process.exit(0))
	.catch((error) => {
		console.error(error);
		process.exit(1);
	});
