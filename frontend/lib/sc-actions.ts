import { mainnet, sepolia } from 'viem/chains';
import {
  http,
  custom,
  type Chain,
  type Address,
  createPublicClient,
  createWalletClient,
} from 'viem';

import { env } from '@/config/env';
import { universalPaymasterAbi } from '@/lib/abi/universalPaymaster';

type CreatePoolParams = {
  paymasterAddress: Address;
  token: Address;
  oracle: Address;
  lpFeeBps: number;
  rebalancingFeeBps: number;
};
type SupplyPoolParams = {
  paymasterAddress: Address;
  token: Address;
  assetsWei: bigint;
  receiver: Address;
};
type WithdrawPoolParams = {
  paymasterAddress: Address;
  token: Address;
  assetsWei: bigint;
  receiver: Address;
  owner: Address;
};
type RebalancePoolParams = {
  paymasterAddress: Address;
  token: Address;
  tokenAmount: bigint;
  maxEthToSend: bigint; // msg.value >= ethAmountAfterDiscount
  receiver: Address;
};

const resolveChain = (): Chain => {
  const supportedChains: Chain[] = [mainnet, sepolia];
  const numericId = Number(env.chainId);
  return supportedChains.find((chain) => chain.id === numericId) ?? mainnet;
};
const resolveRpc = () => {
  const fallbackUrl = mainnet.rpcUrls.default.http[0];
  return http(env.rpcUrl ?? fallbackUrl);
};

export const publicClient = createPublicClient({
  chain: resolveChain(),
  transport: resolveRpc(),
});
export const walletClient = createWalletClient({
  chain: mainnet,
  transport: custom(window.ethereum!),
});

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const writeContract = async (params: any) => {
  const hash = await walletClient.writeContract(params);
  const receipt = await publicClient.waitForTransactionReceipt({ hash });
  return { hash, receipt };
};
const poolIdFromToken = (token: Address): bigint => BigInt(token);

/**  ------ ACTIONS ------ **/

export async function createPool(params: CreatePoolParams) {
  const { paymasterAddress, token, oracle, lpFeeBps, rebalancingFeeBps } =
    params;

  const { hash, receipt } = await writeContract({
    address: paymasterAddress,
    abi: universalPaymasterAbi,
    functionName: 'initializePool',
    args: [token, lpFeeBps, rebalancingFeeBps, oracle],
  });

  return { hash, receipt };
}

export async function supplyToPool(params: SupplyPoolParams) {
  const { paymasterAddress, token, assetsWei, receiver } = params;

  const id = poolIdFromToken(token);
  const { hash, receipt } = await writeContract({
    address: paymasterAddress,
    abi: universalPaymasterAbi,
    functionName: 'deposit',
    args: [assetsWei, receiver, id],
    value: assetsWei, // MUST equal `assets` or it will revert
  });

  return { hash, receipt };
}

export async function withdrawFromPool(params: WithdrawPoolParams) {
  const { paymasterAddress, token, assetsWei, receiver, owner } = params;

  const id = poolIdFromToken(token);
  const _receiver = receiver;
  const _owner = owner;

  const { hash, receipt } = await writeContract({
    address: paymasterAddress,
    abi: universalPaymasterAbi,
    functionName: 'withdraw',
    args: [assetsWei, _receiver, _owner, id],
  });

  return { hash, receipt };
}

export async function rebalancePool(params: RebalancePoolParams) {
  const { paymasterAddress, token, tokenAmount, maxEthToSend, receiver } =
    params;

  const { hash, receipt } = await writeContract({
    address: paymasterAddress,
    abi: universalPaymasterAbi,
    functionName: 'rebalance',
    args: [token, tokenAmount, receiver],
    value: maxEthToSend,
  });

  return { hash, receipt };
}
