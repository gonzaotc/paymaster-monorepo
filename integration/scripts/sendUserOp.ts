import { getChainConfig } from '../src/config';
import { selectedChain } from '../hardhat.config';
import { BundlerClient, createBundlerClient, toSimple7702SmartAccount } from 'viem/account-abstraction';
import { privateKeyToAccount } from 'viem/accounts';
import { createClient, publicActions, walletActions, http, erc20Abi, parseUnits, type Call } from 'viem';
import { sepolia } from 'viem/chains';

/**
 * Convert the EOA into a Simple Smart Account via EIP-7702 signatures.
 * Send a user operation that transfers 1 USDC to the recipient.
 * Uses the given bundler rpc url.
 */
async function main() {
	const chainConfig = getChainConfig(selectedChain);

    const USDC_TRANSFER_AMOUNT = parseUnits('1', 6); // 1 USDC

    const eoa = privateKeyToAccount(chainConfig.USER_PRIVATE_KEY);
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

    const code = await client.getCode({ address: eoa.address });
    const isDelegated = code !== undefined && code.startsWith('0xef0100');
    
    let authorization;
    if (isDelegated) {
        console.log('account already delegated via EIP-7702, skipping authorization');
        authorization = undefined;
    } else {
        console.log('account not yet delegated, creating authorization');
        authorization = await client.signAuthorization(account.authorization);
        console.log('created authorization');
    }

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
        args: [chainConfig.RECIPIENT_ADDRESS, USDC_TRANSFER_AMOUNT], 
    };
    console.log('created tx');

	const hash = await bundlerClient.sendUserOperation({
		account,
		authorization,
		calls: [tx],
	});
	console.log('sent user operation');

	const receipt = await bundlerClient.waitForUserOperationReceipt({ hash });
	console.log('UserOperation receipt', receipt);
}

main()
	.then(() => process.exit(0))
	.catch((error) => {
		console.error(error);
		process.exit(1);
	});

