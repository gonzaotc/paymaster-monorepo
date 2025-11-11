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

    const tokenId = BigInt(chainConfig.USDC);

    const ethReservesBefore = await paymasterContract.read.getPoolEthReserves([chainConfig.USDC]);
    console.log('eth reserves before: ', ethReservesBefore);
    const tokenReservesBefore = await paymasterContract.read.getPoolTokenReserves([chainConfig.USDC]);
    console.log('token reserves before: ', tokenReservesBefore);

    const depositAmount = parseEther('0.1');
    const shares = await paymasterContract.write.deposit([depositAmount, chainConfig.DEPLOYER_ADDRESS, tokenId], { value: depositAmount });
    console.log('received shares: ', shares);

    const ethReservesAfter = await paymasterContract.read.getPoolEthReserves([chainConfig.USDC]);
    console.log('eth reserves after: ', ethReservesAfter);
    const tokenReservesAfter = await paymasterContract.read.getPoolTokenReserves([chainConfig.USDC]);
    console.log('token reserves after: ', tokenReservesAfter);

}

main()
	.then(() => process.exit(0))
	.catch((error) => {
		console.error(error);
		process.exit(1);
	});

