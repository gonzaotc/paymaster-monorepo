'use client';

import { useState } from 'react';
import { LiquidGlassButton } from '@/components/ui/liquid-glass-button';
import { PoolAnalyticsShell } from '@/components/pool-analytics-shell';
import type { PoolRow } from '@/components/pool-table';

type PoolSectionProps = {
  actions: Parameters<typeof PoolAnalyticsShell>[0]['actions'];
  data?: PoolRow[];
};

export function PoolSection({ actions, data }: PoolSectionProps) {
  const [query, setQuery] = useState('');

  return (
    <section className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <p className="text-xs font-semibold uppercase tracking-[0.5em] text-slate-500">
          Pools
        </p>
        <div className="flex w-full flex-col gap-3 sm:w-auto sm:flex-row sm:items-center sm:justify-end">
          <div className="flex flex-1 items-center gap-3 rounded-4xl border border-white/60 bg-white/75 px-4 py-2 shadow-[0_15px_45px_rgba(15,23,42,0.08)] backdrop-blur-2xl sm:w-80">
            <span className="text-slate-400">🔍</span>
            <input
              type="search"
              placeholder="Search pools or tokens"
              value={query}
              onChange={(evt) => setQuery(evt.target.value)}
              className="w-full bg-transparent text-sm text-slate-700 placeholder:text-slate-400 focus:outline-none"
            />
          </div>
          <LiquidGlassButton type="button" className="sm:w-auto">
            Create
          </LiquidGlassButton>
        </div>
      </div>
      <PoolAnalyticsShell actions={actions} data={data} searchQuery={query} />
    </section>
  );
}
