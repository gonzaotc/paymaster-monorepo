import { PoolSection } from '@/components/pool-section';
import { StatusCard } from '@/components/status-card';
import { defaultPoolData } from '@/data/pools';

async function deposit(formData: FormData) {
  'use server';
  console.log('Queue rebalance for', formData.get('poolId'));
}

async function withdraw(formData: FormData) {
  'use server';
  console.log('Pause automation for', formData.get('poolId'));
}

const stats = [
  { label: 'TVL', value: '$120.4K', change: '+12.1% vs last week' },
  { label: 'Avg. APR', value: '5.8%', change: 'Blended across active pools' },
  {
    label: 'Daily Volume',
    value: '$14.2K',
    change: 'Across 42 supported assets',
  },
  { label: 'Txs Sponsored', value: '2784', change: 'In the last 24h' },
];

const poolActions = [
  {
    label: 'Deposit',
    description: 'Add capital to boost this pool’s available liquidity.',
    action: deposit,
  },
  {
    label: 'Withdraw',
    description: 'Unwind capital from the pool back to treasury control.',
    action: withdraw,
    variant: 'ghost' as const,
  },
];

export default function PoolPage() {
  return (
    <main className="flex flex-1 min-h-0 w-full flex-col gap-6 lg:flex-row lg:items-stretch lg:gap-8">
      <div className="flex w-full flex-1 min-h-0 lg:w-3/4 *:flex-1 *:min-h-0">
        <PoolSection actions={poolActions} />
      </div>

      <div className="flex w-full min-h-0 lg:w-1/4">
        <StatusCard stats={stats} poolData={defaultPoolData} />
      </div>
    </main>
  );
}
