import {
	Address,
	erc20Abi,
	maxUint256,
	getContract,
	parseErc6492Signature,
	verifyTypedData,
	Client,
	LocalAccount,
} from 'viem';

export const eip2612Abi = [
	...erc20Abi,
	{
		inputs: [
			{
				internalType: 'address',
				name: 'owner',
				type: 'address',
			},
		],
		stateMutability: 'view',
		type: 'function',
		name: 'nonces',
		outputs: [
			{
				internalType: 'uint256',
				name: '',
				type: 'uint256',
			},
		],
	},
	{
		inputs: [],
		name: 'version',
		outputs: [{ internalType: 'string', name: '', type: 'string' }],
		stateMutability: 'view',
		type: 'function',
	},
] as const;

export async function signPermit({
	account,
	client,
	permitAmount,
	spenderAddress,
	tokenAddress,
}: {
	account: LocalAccount;
	client: Client;
	permitAmount: bigint;
	spenderAddress: Address;
	tokenAddress: Address;
}) {
	const token = getContract({
		client,
		address: tokenAddress,
		abi: eip2612Abi,
	});

	const [name, version, nonce] = await Promise.all([
		token.read.name(),
		token.read.version(),
		token.read.nonces([account.address]),
	]);

	// Build the permit typed data
	const permitData = {
		account: account.address,
		types: {
			Permit: [
				{ name: 'owner', type: 'address' },
				{ name: 'spender', type: 'address' },
				{ name: 'value', type: 'uint256' },
				{ name: 'nonce', type: 'uint256' },
				{ name: 'deadline', type: 'uint256' },
			],
		},
		primaryType: 'Permit' as const,
		domain: {
			chainId: client.chain!.id,
			name,
			verifyingContract: tokenAddress,
			version,
		},
		message: {
			owner: account.address,
			spender: spenderAddress,
			value: permitAmount,
			nonce,
			deadline: maxUint256,
		},
	};

	// Sign the permit
	const signature = await account.signTypedData(permitData);

	// Verify the signature is valid
	const isValid = await verifyTypedData({
		address: account.address,
		types: permitData.types,
		primaryType: permitData.primaryType,
		domain: permitData.domain,
		message: permitData.message,
		signature,
	});

	if (!isValid) {
		throw new Error(`Invalid permit signature for ${account.address}`);
	}

	// Unwrap if it's an ERC-6492 signature (for smart accounts)
	const { signature: unwrappedSignature } = parseErc6492Signature(signature);
	return unwrappedSignature;
}
