import { getChainConfig } from '../src/config';
import { toSimple7702SmartAccount } from 'viem/account-abstraction';
import { privateKeyToAccount } from 'viem/accounts';
import { publicActions, walletActions, http, createWalletClient } from 'viem';

/**
 * Convert the EOA into a Simple Smart Account via EIP-7702 signatures.
 * Send a user operation that transfers 1 USDC to the recipient.
 * Uses the given bundler rpc url.
 */
async function main() {
	const [chainConfig, chain] = getChainConfig();

	const eoa = privateKeyToAccount(chainConfig.USER_PRIVATE_KEY);
	console.log('generated eoa');

	const walletClient = createWalletClient({
		account: eoa,
		chain,
		transport: http(),
	})
		.extend(publicActions)
		.extend(walletActions);
	console.log('generated client');

	const account = await toSimple7702SmartAccount({
		client: walletClient,
		owner: eoa,
	});
	console.log('generated account');

	const code = await walletClient.getCode({ address: eoa.address });
	console.log('eoa code', code);

	const isDelegated = code !== undefined && code.startsWith('0xef0100');

	if (isDelegated) {
		console.log('account already delegated via EIP-7702, skipping authorization');
		return;
	}

	console.log('account not yet delegated, creating authorization');
	const authorization = await walletClient.signAuthorization(account.authorization);
	console.log('generated authorization');

	const hash = await walletClient.sendTransaction({
		authorizationList: [authorization],
		data: '0xdeadbeef',
		to: eoa.address,
	});
	console.log('transaction hash', hash);
}

main()
	.then(() => process.exit(0))
	.catch((error) => {
		console.error(error);
		process.exit(1);
	});
