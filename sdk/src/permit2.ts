import { Address, LocalAccount, Hex, WalletClient, Account } from 'viem';
import { AllowanceTransfer, type PermitSingle } from '@gonzaotc/permit2-sdk-viem';
import { PERMIT2_ADDRESS } from './constants';

interface Permit2 {
	/**
	 * Builds a Permit2Single permit.
	 * @param token - The token to permit.
	 * @param amount - The amount to permit.
	 * @param spender - The spender of the permit.
	 * @param sigDeadline - The signature deadline of the permit.
	 * @param expiration - The expiration of the permit.
	 * @param nonce - The nonce of the permit.
	 * @returns The Permit2Single permit.
	 */
	buildPermit2Single(
		token: Address,
		amount: bigint,
		spender: Address,
		nonce: number,
		sigDeadline?: bigint,
		expiration?: number
	): PermitSingle;

	// Overload 1: Sign Permit2Single using LocalAccount directly
	/**
	 * Signs a Permit2Single permit using a LocalAccount.
	 * @param permitSingle - The permit to sign.
	 * @param account - The account to sign the permit.
	 * @param chainId - The chain id to sign the permit.
	 * @returns The signed Permit2Single permit.
	 */
	signPermit2Single(
		permitSingle: PermitSingle,
		account: LocalAccount,
		chainId: number
	): Promise<Hex>;
	// Overload 2: Sign Permit2Single using WalletClient with Account
	/**
	 * Signs a Permit2Single permit using a WalletClient with Account.
	 * @param permitSingle - The permit to sign.
	 * @param walletClient - The wallet client to sign the permit.
	 * @param account - The account to sign the permit.
	 * @param chainId - The chain id to sign the permit.
	 * @returns The signed Permit2Single permit.
	 */
	signPermit2Single(
		permitSingle: PermitSingle,
		walletClient: WalletClient,
		account: Account,
		chainId: number
	): Promise<Hex>;
}

export const permit2: Permit2 = {
	buildPermit2Single(
		token: Address,
		amount: bigint,
		spender: Address,
		nonce: number,
		sigDeadline?: bigint,
		expiration?: number
	): PermitSingle {
		return {
			details: {
				token,
				amount,
				expiration: expiration ?? 0,
				nonce,
			},
			spender,
			sigDeadline: sigDeadline ?? BigInt(0),
		};
	},

	/**
	 * Signs a Permit2Single permit.
	 * @param permitSingle - The permit to sign.
	 * @param accountOrWallet - The account or wallet to sign the permit.
	 * @param accountOrChainId - The account or chain id to sign the permit.
	 * @param chainId - The chain id to sign the permit.
	 * @returns The signed Permit2Single permit.
	 */
	signPermit2Single(
		permitSingle: PermitSingle,
		accountOrWallet: LocalAccount | WalletClient,
		accountOrChainId: Account | number,
		chainId?: number
	): Promise<Hex> {
		const { domain, types, values } = AllowanceTransfer.getPermitData(
			permitSingle,
			PERMIT2_ADDRESS,
			// If chainId is provided, use it; otherwise accountOrChainId must be the chainId
			chainId ?? (accountOrChainId as number)
		);

		if ('signTypedData' in accountOrWallet && typeof accountOrChainId === 'number') {
			const account = accountOrWallet as LocalAccount;
			return account.signTypedData({
				domain,
				types,
				primaryType: 'PermitSingle',
				message: values as unknown as Record<string, unknown>,
			});
		}

		const walletClient = accountOrWallet as WalletClient;
		const account = accountOrChainId as Account;
		return walletClient.signTypedData({
			account,
			domain,
			types,
			primaryType: 'PermitSingle',
			message: values as unknown as Record<string, unknown>,
		});
	},
};
