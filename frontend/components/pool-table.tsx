'use client';

import { useMemo } from 'react';
import {
  ColumnDef,
  flexRender,
  getCoreRowModel,
  useReactTable,
} from '@tanstack/react-table';

export type PoolRow = {
  id: string;
  pool: string;
  fee: string;
  tvl: string;
  apr: string;
  sevenDayVolume: string;
  rebalanceFrequency: string;
};

export const defaultPoolData: PoolRow[] = [
  {
    id: 'eth-usdc',
    pool: 'ETH / USDC',
    fee: '0.05%',
    tvl: '$24.6M',
    apr: '5.2%',
    sevenDayVolume: '$8.9M',
    rebalanceFrequency: '2x / day',
  },
  {
    id: 'sol-eth',
    pool: 'SOL / ETH',
    fee: '0.30%',
    tvl: '$9.8M',
    apr: '7.1%',
    sevenDayVolume: '$3.2M',
    rebalanceFrequency: 'hourly',
  },
  {
    id: 'btc-usdt',
    pool: 'BTC / USDT',
    fee: '0.10%',
    tvl: '$41.0M',
    apr: '4.2%',
    sevenDayVolume: '$12.4M',
    rebalanceFrequency: 'daily',
  },
];

const columns: ColumnDef<PoolRow>[] = [
  {
    header: 'Pool',
    accessorKey: 'pool',
  },
  {
    header: 'Fee',
    accessorKey: 'fee',
  },
  {
    header: 'TVL',
    accessorKey: 'tvl',
  },
  {
    header: 'APR',
    accessorKey: 'apr',
  },
  {
    header: '7D Vol',
    accessorKey: 'sevenDayVolume',
  },
  {
    header: 'Rebalance F',
    accessorKey: 'rebalanceFrequency',
  },
];

type PoolTableProps = {
  data?: PoolRow[];
  className?: string;
  caption?: string;
  selectedPoolId?: string | null;
  onSelectRow?: (row: PoolRow) => void;
};

export function PoolTable({
  data = defaultPoolData,
  caption,
  className,
  selectedPoolId,
  onSelectRow,
}: PoolTableProps) {
  const dataset = useMemo(() => data, [data]);
  const table = useReactTable({
    data: dataset,
    columns,
    getCoreRowModel: getCoreRowModel(),
  });

  const containerClasses = [
    'w-full rounded-[2rem] border border-white/80 bg-white p-6 shadow-[0_25px_80px_rgba(76,99,237,0.1)] backdrop-blur-xl transition-shadow sm:p-8',
    'hover:shadow-[0_30px_100px_rgba(76,99,237,0.16)]',
    className,
  ]
    .filter(Boolean)
    .join(' ');

  return (
    <div className={containerClasses}>
      <div className="mb-6 text-sm font-semibold uppercase tracking-[0.3em] text-slate-500">
        {caption}
      </div>

      <div className="-mx-2 overflow-x-auto px-2">
        <table className="w-full border-separate border-spacing-0 text-left">
          <thead>
            {table.getHeaderGroups().map((headerGroup) => (
              <tr key={headerGroup.id} className="border-b border-slate-200/80">
                {headerGroup.headers.map((header) => (
                  <th
                    key={header.id}
                    className="pb-3 text-[0.7rem] font-semibold uppercase tracking-[0.18em] text-slate-500">
                    {header.isPlaceholder
                      ? null
                      : flexRender(
                          header.column.columnDef.header,
                          header.getContext()
                        )}
                  </th>
                ))}
              </tr>
            ))}
          </thead>

          <tbody className="text-sm text-slate-700">
            {table.getRowModel().rows.map((row) => (
              <tr
                key={row.id}
                role={onSelectRow ? 'button' : undefined}
                tabIndex={onSelectRow ? 0 : undefined}
                aria-selected={selectedPoolId === row.original.id}
                onClick={() => onSelectRow?.(row.original)}
                onKeyDown={(evt) => {
                  if (evt.key === 'Enter' || evt.key === ' ') {
                    evt.preventDefault();
                    onSelectRow?.(row.original);
                  }
                }}
                className={[
                  'border-b border-slate-100 last:border-0',
                  onSelectRow
                    ? 'cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-200'
                    : '',
                  selectedPoolId === row.original.id
                    ? 'bg-indigo-50/70 hover:bg-indigo-100/70'
                    : 'hover:bg-slate-50/80',
                ]
                  .filter(Boolean)
                  .join(' ')}>
                {row.getVisibleCells().map((cell) => (
                  <td
                    className="py-4 text-sm font-medium text-slate-700"
                    key={cell.id}>
                    {flexRender(cell.column.columnDef.cell, cell.getContext())}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
