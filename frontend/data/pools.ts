export type PoolRow = {
  id: string;
  pool: string;
  tokens?: [string, string];
  fee: string;
  tvl: string;
  apr: string;
  sevenDayVolume: string;
  rebalanceFactor: string;
};

export const defaultPoolData: PoolRow[] = [
  {
    id: 'eth-usdc',
    pool: 'ETH / USDC',
    tokens: ['ETH', 'USDC'],
    fee: '0.05%',
    tvl: '$52.4M',
    apr: '5.1%',
    sevenDayVolume: '$14.8K',
    rebalanceFactor: '100%',
  },
  {
    id: 'eth-usdt',
    pool: 'ETH / USDT',
    tokens: ['ETH', 'USDT'],
    fee: '0.04%',
    tvl: '$43.1M',
    apr: '4.7%',
    sevenDayVolume: '$10.2K',
    rebalanceFactor: '99.8%',
  },
  {
    id: 'eth-dai',
    pool: 'ETH / DAI',
    tokens: ['ETH', 'DAI'],
    fee: '0.03%',
    tvl: '$18.2M',
    apr: '4.9%',
    sevenDayVolume: '$6.5K',
    rebalanceFactor: '99.5%',
  },
  {
    id: 'eth-wbtc',
    pool: 'ETH / WBTC',
    tokens: ['ETH', 'WBTC'],
    fee: '0.07%',
    tvl: '$12.7M',
    apr: '6.2%',
    sevenDayVolume: '$7.9K',
    rebalanceFactor: '99.2%',
  },
  {
    id: 'eth-uni',
    pool: 'ETH / UNI',
    tokens: ['ETH', 'UNI'],
    fee: '0.15%',
    tvl: '$6.3M',
    apr: '7.4%',
    sevenDayVolume: '$5.1K',
    rebalanceFactor: '98.9%',
  },
  {
    id: 'eth-op',
    pool: 'ETH / OP',
    tokens: ['ETH', 'OP'],
    fee: '0.12%',
    tvl: '$25.6M',
    apr: '6.9%',
    sevenDayVolume: '$4.4K',
    rebalanceFactor: '98.6%',
  },
];
