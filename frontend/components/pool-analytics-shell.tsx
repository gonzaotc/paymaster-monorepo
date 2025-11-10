'use client';

import { useEffect, useMemo, useRef, useState, useTransition } from 'react';
import { PoolRow, PoolTable, defaultPoolData } from '@/components/pool-table';

type PoolAction = {
  label: string;
  description?: string;
  action: (formData: FormData) => void;
  variant?: 'primary' | 'ghost';
};

type PoolAnalyticsShellProps = {
  data?: PoolRow[];
  actions?: PoolAction[];
};

export function PoolAnalyticsShell({
  data = defaultPoolData,
  actions = [],
}: PoolAnalyticsShellProps) {
  const [selectedPoolId, setSelectedPoolId] = useState<string | null>(
    data[0]?.id ?? null
  );
  const [isPending, startTransition] = useTransition();
  const [isPanelOpen, setIsPanelOpen] = useState(false);
  const [isPanelMounted, setIsPanelMounted] = useState(false);
  const closeTimerRef = useRef<NodeJS.Timeout | null>(null);

  const selectedPool = useMemo(
    () => data.find((pool) => pool.id === selectedPoolId) ?? null,
    [data, selectedPoolId]
  );

  const handleSelectRow = (row: PoolRow) => {
    startTransition(() => {
      setSelectedPoolId(row.id);
      if (!isPanelMounted) {
        setIsPanelMounted(true);
      } else {
        setIsPanelOpen(true);
      }
    });
  };

  const closePanel = () => {
    setIsPanelOpen(false);
  };

  useEffect(() => {
    const onKeyDown = (evt: KeyboardEvent) => {
      if (evt.key === 'Escape') {
        closePanel();
      }
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, []);

  useEffect(() => {
    if (!isPanelMounted) {
      return;
    }
    const rafId = requestAnimationFrame(() => setIsPanelOpen(true));
    return () => cancelAnimationFrame(rafId);
  }, [isPanelMounted]);

  useEffect(() => {
    if (closeTimerRef.current) {
      clearTimeout(closeTimerRef.current);
      closeTimerRef.current = null;
    }
    if (!isPanelOpen && isPanelMounted) {
      closeTimerRef.current = setTimeout(() => {
        setIsPanelMounted(false);
      }, 220);
    }
  }, [isPanelOpen, isPanelMounted]);

  useEffect(
    () => () => {
      if (closeTimerRef.current) {
        clearTimeout(closeTimerRef.current);
      }
    },
    []
  );

  const panelClasses = [
    'fixed right-0 top-0 z-50 flex h-full w-full max-w-md flex-col gap-6 bg-white/90 p-6 shadow-[0_35px_100px_rgba(15,23,42,0.2)] backdrop-blur-lg transition-transform duration-200 ease-out sm:p-8',
    isPanelOpen ? 'translate-x-0' : 'translate-x-full',
  ].join(' ');

  const backdropClasses = [
    'fixed inset-0 z-40 h-full w-full bg-slate-900/20 backdrop-blur transition-opacity duration-200',
    isPanelOpen ? 'opacity-100' : 'pointer-events-none opacity-0',
  ].join(' ');

  const overlayVisible = isPanelMounted;

  return (
    <div className="relative">
      <PoolTable
        data={data}
        className="bg-white"
        onSelectRow={handleSelectRow}
        selectedPoolId={selectedPoolId}
      />

      {overlayVisible && (
        <>
          <button
            aria-label="Close pool action panel"
            className={backdropClasses}
            onClick={closePanel}
            type="button"
          />

          <aside role="dialog" aria-modal="true" className={panelClasses}>
            <div className="flex items-start justify-between">
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.5em] text-slate-500">
                  Selected pool
                </p>
                <h3 className="text-2xl font-semibold text-slate-900">
                  {selectedPool?.pool ?? 'No pool'}
                </h3>
              </div>
              <button
                type="button"
                onClick={closePanel}
                className="rounded-full border border-slate-200/80 px-3 py-1 text-xs font-semibold text-slate-500">
                Close
              </button>
            </div>

            {selectedPool ? (
              <div className="flex flex-col justify-between h-full">
                <dl className="grid grid-cols-2 gap-4 text-sm text-slate-600">
                  <div>
                    <dt className="text-xs uppercase tracking-[0.3em] text-slate-400">
                      TVL
                    </dt>
                    <dd className="text-lg font-semibold text-slate-900">
                      {selectedPool.tvl}
                    </dd>
                  </div>
                  <div>
                    <dt className="text-xs uppercase tracking-[0.3em] text-slate-400">
                      APR
                    </dt>
                    <dd className="text-lg font-semibold text-slate-900">
                      {selectedPool.apr}
                    </dd>
                  </div>
                  <div>
                    <dt className="text-xs uppercase tracking-[0.3em] text-slate-400">
                      7D Volume
                    </dt>
                    <dd className="text-lg font-semibold text-slate-900">
                      {selectedPool.sevenDayVolume}
                    </dd>
                  </div>
                  <div>
                    <dt className="text-xs uppercase tracking-[0.3em] text-slate-400">
                      Rebalance
                    </dt>
                    <dd className="text-lg font-semibold text-slate-900">
                      {selectedPool.rebalanceFrequency}
                    </dd>
                  </div>
                </dl>

                <div className="space-y-4">
                  {actions.length === 0 && (
                    <p className="text-sm text-slate-500">
                      Hook up server actions to perform rebalances, override
                      fees, or trigger alerts.
                    </p>
                  )}

                  {actions.map((action) => (
                    <div key={action.label} className="space-y-1">
                      <form action={action.action} className="flex">
                        <input
                          type="hidden"
                          name="poolId"
                          value={selectedPool.id}
                        />
                        <input
                          type="hidden"
                          name="poolName"
                          value={selectedPool.pool}
                        />
                        <button
                          type="submit"
                          className={[
                            'w-full rounded-full px-5 py-3 text-sm font-semibold transition',
                            action.variant === 'ghost'
                              ? 'border border-slate-200/80 text-slate-600 hover:bg-slate-50'
                              : 'bg-accent text-white shadow-lg shadow-[rgba(76,99,237,0.35)] hover:bg-indigo-500',
                          ].join(' ')}>
                          {action.label}
                        </button>
                      </form>
                      {action.description && (
                        <p className="text-xs text-slate-400">
                          {action.description}
                        </p>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            ) : (
              <div className="text-sm text-slate-500">
                Select a pool to inspect its metrics.
              </div>
            )}
          </aside>
        </>
      )}
    </div>
  );
}
