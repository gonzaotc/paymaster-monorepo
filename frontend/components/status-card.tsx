import { defaultPoolData, type PoolRow } from '@/data/pools';
import { StatusDonut } from './status-donut';
import { CountUpValue } from '@/components/count-up-value';

type StatusCardProps = {
  stats: Array<{ label: string; value: string; change: string }>;
  poolData?: PoolRow[];
};

const parseTvlValue = (raw: string) => {
  const normalized = raw.replace(/,/g, '').trim();
  const match = normalized.match(/([\d.]+)/);
  if (!match) {
    return 0;
  }
  const amount = parseFloat(match[1]);
  if (normalized.toLowerCase().includes('b')) {
    return amount * 1_000_000_000;
  }
  if (normalized.toLowerCase().includes('m')) {
    return amount * 1_000_000;
  }
  if (normalized.toLowerCase().includes('k')) {
    return amount * 1_000;
  }
  return amount;
};

export function StatusCard({ stats, poolData }: StatusCardProps) {
  const sourcePools =
    Array.isArray(poolData) && poolData.length > 0 ? poolData : defaultPoolData;

  const sortedPools = [...sourcePools]
    .map((pool) => ({
      id: pool.id,
      label: pool.pool,
      value: parseTvlValue(pool.tvl),
    }))
    .sort((a, b) => b.value - a.value);

  const topFive = sortedPools.slice(0, 5);
  const remaining = sortedPools.slice(5);
  const othersValue = remaining.reduce((sum, pool) => sum + pool.value, 0);

  const donutData =
    othersValue > 0
      ? [...topFive, { id: 'others', label: 'Others', value: othersValue }]
      : topFive;

  const totalValue = donutData.reduce((sum, entry) => sum + entry.value, 0);

  return (
    <section className="flex h-full flex-1 flex-col gap-6 rounded-4xl border border-white/75 bg-white/95 p-6 shadow-[0_25px_80px_rgba(15,23,42,0.08)] backdrop-blur-2xl sm:p-7">
      <div>
        <p className="shimmer-heading text-xs font-medium uppercase tracking-[0.4em] text-center">
          UNIVERSAL PAYMASTER
        </p>

        <div className="flex w-full items-center justify-center">
          <StatusDonut data={donutData} totalValue={totalValue} />
        </div>
      </div>

      <div className="flex-1 flex flex-col items-start justify-end gap-6 mb-10">
        {stats.slice(1).map((stat) => (
          <div key={stat.label} className="flex flex-col justify-between">
            <div>
              <p className="text-[0.7rem] font-semibold uppercase tracking-[0.18em] text-slate-500">
                {stat.label}
              </p>
              <p className="mt-2 text-[0.95rem] font-medium text-slate-900/80 tracking-[0.01em]">
                <CountUpValue value={stat.value} durationMs={600} />
              </p>
            </div>
            <p className="text-[0.7rem] text-slate-500/90 tracking-widest uppercase">
              {stat.change}
            </p>
          </div>
        ))}
      </div>
    </section>
  );
}
