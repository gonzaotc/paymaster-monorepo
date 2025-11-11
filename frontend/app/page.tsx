import { PasskeyStatusPanel } from '@/components/passkey-status-panel';
import { PoolSection } from '@/components/pool-section';

const stats = [
  { label: 'TVL', value: '$120.4K', change: '+12.1% vs last week' },
  { label: 'Avg. APR', value: '5.8%', change: 'Blended across active pools' },
  {
    label: 'Daily Volume',
    value: '$14.2K',
    change: 'Across 42 supported assets',
  },
  { label: 'Transactions Sponsored', value: '2784', change: 'In the last 24h' },
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

export default function Home() {
  const privyEnabled = Boolean(process.env.NEXT_PUBLIC_PRIVY_APP_ID);

  return (
    <main className="min-h-screen">
      <div className="mx-auto flex min-h-screen max-w-5xl flex-col gap-10 px-4 py-12 sm:px-6 lg:px-8">
        {/* <header className="text-center">
          <p className="text-xs font-semibold uppercase tracking-[0.5em] text-slate-500">
            Universal Paymaster
          </p>
        </header> */}

        <section className={`${panelClass} space-y-6`}>
          <div className="flex flex-col gap-2 text-center sm:text-left">
            <p className="text-xs font-semibold uppercase tracking-[0.5em] text-slate-500">
              Status
            </p>
            <h2 className="text-2xl font-semibold text-slate-900">
              Universal Paymaster
            </h2>
          </div>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {stats.map((stat) => (
              <div
                key={stat.label}
                className="rounded-[1.25rem] border border-white/90 bg-white p-4 shadow-[0_12px_40px_rgba(15,23,42,0.06)]">
                <p className="text-xs font-medium uppercase tracking-[0.4em] text-slate-400">
                  {stat.label}
                </p>
                <p className="mt-3 text-2xl font-semibold text-slate-900">
                  {stat.value}
                </p>
                <p className="text-sm text-slate-500">{stat.change}</p>
              </div>
            ))}
          </div>
        </section>

        {/* <section className={`${panelClass} space-y-6`}>
          <div className="flex flex-col gap-2 text-center sm:text-left">
            <p className="text-xs font-semibold uppercase tracking-[0.5em] text-slate-500">
              Authentication preview
            </p>
            <h2 className="text-2xl font-semibold text-slate-900">
              Privy passkey login
            </h2>
            <p className="text-sm text-slate-600">
              Use this standalone probe to confirm Privy SDK readiness, session state, and the
              passkey challenge flow without wiring it into the rest of the dashboard.
            </p>
          </div>
          <PasskeyStatusPanel enabled={privyEnabled} />
        </section> */}

        <PoolSection actions={poolActions} />
      </div>
    </main>
  );
}
