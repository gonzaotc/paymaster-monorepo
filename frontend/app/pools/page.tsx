import { PoolSection } from '@/components/pool-section';

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

const panelClass =
  'rounded-[2rem] border border-white/80 bg-white/95 p-6 shadow-[0_25px_80px_rgba(15,23,42,0.08)] backdrop-blur-2xl sm:p-8';

async function deposit(formData: FormData) {
  'use server';
  console.log('Queue rebalance for', formData.get('poolId'));
}

async function withdraw(formData: FormData) {
  'use server';
  console.log('Pause automation for', formData.get('poolId'));
}

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
  const [primaryStat, ...secondaryStats] = stats;

  return (
    <main className="flex flex-1 min-h-0 w-full flex-col gap-6 lg:flex-row lg:items-stretch lg:gap-8">
      <div className="flex w-full flex-1 min-h-0 lg:w-3/4 *:flex-1 *:min-h-0">
        <PoolSection actions={poolActions} />
      </div>

      <div className="flex w-full min-h-0 lg:w-1/4">
        <section className={`${panelClass} flex h-full flex-1 flex-col gap-6`}>
          <div className="space-y-4">
            <p className="text-xs font-semibold uppercase tracking-[0.5em] text-slate-500">
              Status
            </p>
            <div className="rounded-3xl border border-white/70 bg-linear-to-br from-indigo-500 via-indigo-400 to-indigo-300 p-5 text-white shadow-[0_20px_60px_rgba(76,99,237,0.25)]">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs uppercase tracking-[0.5em] text-white/70">
                    Automation
                  </p>
                  <p className="mt-1 text-lg font-semibold">Operational</p>
                  <p className="text-sm text-white/70">Synced moments ago</p>
                </div>
                <span className="rounded-full bg-white/15 px-3 py-1 text-xs font-semibold">
                  Healthy
                </span>
              </div>
              {primaryStat ? (
                <div className="mt-6">
                  <p className="text-xs font-semibold uppercase tracking-[0.4em] text-white/60">
                    {primaryStat.label}
                  </p>
                  <p className="mt-2 text-3xl font-semibold">
                    {primaryStat.value}
                  </p>
                  <p className="text-sm text-white/80">{primaryStat.change}</p>
                </div>
              ) : null}
            </div>
          </div>

          <div className="grid flex-1 grid-cols-1 gap-3">
            {secondaryStats.map((stat) => (
              <div
                key={stat.label}
                className="flex flex-col justify-between rounded-[1.25rem] border border-white/80 bg-white/90 p-4 text-left shadow-[0_12px_40px_rgba(15,23,42,0.08)]">
                <div>
                  <p className="text-xs font-medium uppercase tracking-[0.4em] text-slate-400">
                    {stat.label}
                  </p>
                  <p className="mt-2 text-2xl font-semibold text-slate-900">
                    {stat.value}
                  </p>
                </div>
                <p className="text-xs text-slate-500">{stat.change}</p>
              </div>
            ))}
          </div>
        </section>
      </div>
    </main>
  );
}
