'use client';

import {
  useDeferredValue,
  useEffect,
  useMemo,
  useRef,
  useState,
  useTransition,
} from 'react';
import { PoolTable } from '@/components/pool-table';
import { LiquidGlassButton } from '@/components/ui/liquid-glass-button';
import { defaultPoolData, type PoolRow } from '@/data/pools';

type PoolAction = {
  label: string;
  description?: string;
  action: (formData: FormData) => void;
  variant?: 'primary' | 'ghost';
};

type PoolAnalyticsShellProps = {
  data?: PoolRow[];
  actions?: PoolAction[];
  searchQuery?: string;
};

export function PoolAnalyticsShell({
  data = defaultPoolData,
  actions = [],
  searchQuery = '',
}: PoolAnalyticsShellProps) {
  const [selectedPoolId, setSelectedPoolId] = useState<string | null>(null);
  const deferredQuery = useDeferredValue(searchQuery);
  const [, startTransition] = useTransition();
  const [isPanelOpen, setIsPanelOpen] = useState(false);
  const [isPanelMounted, setIsPanelMounted] = useState(false);
  const closeTimerRef = useRef<NodeJS.Timeout | null>(null);

  const filteredData = useMemo(() => {
    if (!deferredQuery.trim()) {
      return data;
    }
    const normalized = deferredQuery.trim().toLowerCase();
    return data.filter((pool) => {
      const matchPool = pool.pool.toLowerCase().includes(normalized);
      const matchTokens = pool.tokens?.some((token) =>
        token.toLowerCase().includes(normalized)
      );
      return matchPool || matchTokens;
    });
  }, [data, deferredQuery]);

  const selectedPool = useMemo(
    () => filteredData.find((pool) => pool.id === selectedPoolId) ?? null,
    [filteredData, selectedPoolId]
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
    setSelectedPoolId(null);
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
    if (isPanelOpen) {
      const originalOverflow = document.body.style.overflow;
      document.body.style.overflow = 'hidden';
      return () => {
        document.body.style.overflow = originalOverflow;
      };
    }
  }, [isPanelOpen]);

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
    <div className="relative flex h-full flex-col">
      <PoolTable
        data={filteredData}
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
                  Pool
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
                      Rebalance Factor
                    </dt>
                    <dd className="text-lg font-semibold text-slate-900">
                      {selectedPool.rebalanceFactor}
                    </dd>
                  </div>
                  <div>
                    <dt className="text-xs uppercase tracking-[0.3em] text-slate-400">
                      LPFee
                    </dt>
                    <dd className="text-lg font-semibold text-slate-900">
                      {selectedPool.fee}
                    </dd>
                  </div>
                  <div>
                    <dt className="text-xs uppercase tracking-[0.3em] text-slate-400">
                      Rebalancing Fee
                    </dt>
                    <dd className="text-lg font-semibold text-slate-900">
                      0.5%
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
                      <form action={action.action} className="flex w-full">
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
                        <LiquidGlassButton type="submit" className="w-full">
                          {action.label}
                        </LiquidGlassButton>
                      </form>
                      {action.description && (
                        <p className="text-xs text-slate-400">
                          {action.description}
                        </p>
                      )}
                    </div>
                  ))}

                  <div className="space-y-1">
                    <LiquidGlassButton type="button" className="w-full">
                      Rebalance
                    </LiquidGlassButton>
                    <p className="text-xs text-slate-400">
                      Swap ETH for the pool’s paired token to refill reserves.
                    </p>
                  </div>
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
