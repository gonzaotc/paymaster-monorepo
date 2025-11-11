import hre from 'hardhat';
import { universalPaymasterAbi, entryPointAbi } from 'paymaster-sdk';
import { getContract, formatEther, formatUnits } from 'viem';
import { getChainConfig } from '../src/config';

/**
 * Deploy the UniversalPaymaster contract to the selected chain
 */
async function main() {
    const [chainConfig, ] = getChainConfig();
    const publicClient = await hre.viem.getPublicClient();

    const paymasterContract = getContract({
        address: chainConfig.PAYMASTER,
        abi: universalPaymasterAbi,
        client: { public: publicClient },
    });

    const entryPointContract = getContract({
        address: chainConfig.ENTRY_POINT,
        abi: entryPointAbi,
        client: { public: publicClient },
    });

    const paymasterDeposit = await entryPointContract.read.balanceOf([chainConfig.PAYMASTER]);
    console.log('paymaster deposit', formatEther(paymasterDeposit));

    const ethReserves = await paymasterContract.read.getPoolEthReserves([chainConfig.USDC]);
    console.log('pool ethReserves', formatEther(ethReserves));

    const tokenReserves = await paymasterContract.read.getPoolTokenReserves([chainConfig.USDC]);
    console.log('pool tokenReserves', formatUnits(tokenReserves, 6));

    const pool = await paymasterContract.read.pools([chainConfig.USDC]);
    console.log('pool', pool);
}

main()
	.then(() => process.exit(0))
	.catch((error) => {
		console.error(error);
		process.exit(1);
	});

