export const universalPaymasterAbi = [
  // ---- UniversalPaymaster bits ----
  {
    type: 'function',
    name: 'initializePool',
    stateMutability: 'nonpayable',
    inputs: [
      { name: 'token', type: 'address' },
      { name: 'lpFeeBps', type: 'uint24' },
      { name: 'rebalancingFeeBps', type: 'uint24' },
      { name: 'oracle', type: 'address' },
    ],
    outputs: [],
  },
  {
    type: 'function',
    name: 'rebalance',
    stateMutability: 'payable',
    inputs: [
      { name: 'token', type: 'address' },
      { name: 'tokenAmount', type: 'uint256' },
      { name: 'receiver', type: 'address' },
    ],
    outputs: [{ name: 'ethAmountAfterDiscount', type: 'uint256' }],
  },

  // ---- ERC6909NativeEntryPointVault ----
  {
    type: 'function',
    name: 'deposit',
    stateMutability: 'payable',
    inputs: [
      { name: 'assets', type: 'uint256' },
      { name: 'receiver', type: 'address' },
      { name: 'id', type: 'uint256' },
    ],
    outputs: [{ name: 'shares', type: 'uint256' }],
  },
  {
    type: 'function',
    name: 'withdraw',
    stateMutability: 'nonpayable',
    inputs: [
      { name: 'assets', type: 'uint256' },
      { name: 'receiver', type: 'address' },
      { name: 'owner', type: 'address' },
      { name: 'id', type: 'uint256' },
    ],
    outputs: [{ name: 'shares', type: 'uint256' }],
  },
  {
    type: 'function',
    name: 'totalAssets',
    stateMutability: 'view',
    inputs: [{ name: 'id', type: 'uint256' }],
    outputs: [{ name: 'assets', type: 'uint256' }],
  },
  {
    type: 'function',
    name: 'previewDeposit',
    stateMutability: 'view',
    inputs: [
      { name: 'assets', type: 'uint256' },
      { name: 'id', type: 'uint256' },
    ],
    outputs: [{ name: 'shares', type: 'uint256' }],
  },
  {
    type: 'function',
    name: 'previewWithdraw',
    stateMutability: 'view',
    inputs: [
      { name: 'assets', type: 'uint256' },
      { name: 'id', type: 'uint256' },
    ],
    outputs: [{ name: 'shares', type: 'uint256' }],
  },
] as const;
