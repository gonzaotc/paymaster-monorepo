'use client';

import Image from 'next/image';
import { type ReactNode, useMemo, useState } from 'react';
import {
  ColumnDef,
  SortingState,
  flexRender,
  getCoreRowModel,
  getSortedRowModel,
  useReactTable,
} from '@tanstack/react-table';
import { InfoBadge } from '@/components/ui/info-badge';
import { defaultPoolData, type PoolRow } from '@/data/pools';

const parseCurrency = (value: string) =>
  Number(value.replace(/[^0-9.]/g, '')) || 0;

const parsePercent = (value: string) =>
  Number(value.replace(/[^0-9.]/g, '')) || 0;

const tokenIcons: Record<string, { src: string; alt: string }> = {
  ETH: { src: '/svg/eth.svg', alt: 'Ethereum' },
  USDC: { src: '/svg/usdc.svg', alt: 'USD Coin' },
  USDT: { src: '/svg/usdt.svg', alt: 'Tether' },
  DAI: { src: '/svg/dai.svg', alt: 'Dai' },
  WBTC: { src: '/svg/bitcoin.svg', alt: 'Wrapped Bitcoin' },
  BTC: { src: '/svg/bitcoin.svg', alt: 'Bitcoin' },
  UNI: { src: '/svg/uniswap.svg', alt: 'Uniswap' },
  OP: { src: '/svg/optimism.svg', alt: 'Optimism' },
};

const tokenBaseStyle = {
  boxShadow: '0 10px 20px rgba(125, 139, 178, 0.35)',
};

const metricValueClass =
  'text-[0.95rem] font-medium text-slate-800/80 tracking-[0.01em] tabular-nums';

const makeHeader = (label: string, tooltip?: ReactNode) => (
  <span className="inline-flex items-center gap-1.5 leading-none">
    {label}
    {tooltip ? <InfoBadge content={tooltip} className="self-center" /> : null}
  </span>
);

const TokenGlyph = ({ symbol }: { symbol: string }) => {
  const icon = tokenIcons[symbol.toUpperCase()];
  const fallbackLabel = symbol.slice(0, 3).toUpperCase();

  return (
    <span
      className="flex h-8 w-8 items-center justify-center rounded-full"
      style={tokenBaseStyle}>
      {icon ? (
        <Image
          src={icon.src}
          alt={icon.alt}
          width={20}
          height={20}
          className="h-7 w-7 object-contain"
        />
      ) : (
        <span className="text-[0.6rem] font-semibold text-slate-700">
          {fallbackLabel}
        </span>
      )}
    </span>
  );
};

const TokenPair = ({ tokens }: { tokens: [string, string] }) => (
  <span className="relative mr-3 inline-flex items-center">
    <span className="relative z-10 inline-flex">
      <TokenGlyph symbol={tokens[0]} />
    </span>
    <span className="-ml-3 inline-flex">
      <TokenGlyph symbol={tokens[1]} />
    </span>
  </span>
);

const columns: ColumnDef<PoolRow>[] = [
  {
    header: () => makeHeader('Pool'),
    accessorKey: 'pool',
    cell: ({ row }) => {
      const tokens =
        row.original.tokens ??
        (row.original.pool.split('/').map((token) => token.trim()) as [
          string,
          string,
        ]);
      const pairLabel = `${tokens[0]}/${tokens[1]}`;
      return (
        <div className="flex items-center gap-3">
          <TokenPair tokens={tokens} />
          <span className="text-[0.68rem] font-semibold uppercase tracking-[0.32em] text-slate-500">
            {pairLabel}
          </span>
        </div>
      );
    },
    enableSorting: false,
  },
  {
    header: () =>
      makeHeader(
        'Fee',
        <span className="whitespace-nowrap">
          Fee = depositor fee + rebalancing fee
        </span>
      ),
    accessorKey: 'fee',
    sortingFn: 'text',
    cell: ({ getValue }) => (
      <span className={metricValueClass}>{getValue<string>()}</span>
    ),
  },
  {
    header: () => makeHeader('TVL', 'X (ETH) + Y (paired token) in USD'),
    accessorKey: 'tvl',
    cell: ({ getValue }) => (
      <span className={metricValueClass}>{getValue<string>()}</span>
    ),
    sortingFn: (rowA, rowB, columnId) => {
      return (
        parseCurrency(rowA.getValue(columnId)) -
        parseCurrency(rowB.getValue(columnId))
      );
    },
  },
  {
    header: () => makeHeader('APR', 'Annualized percentage return'),
    accessorKey: 'apr',
    cell: ({ getValue }) => (
      <span className={metricValueClass}>{getValue<string>()}</span>
    ),
    sortingFn: (rowA, rowB, columnId) => {
      return (
        parsePercent(rowA.getValue(columnId)) -
        parsePercent(rowB.getValue(columnId))
      );
    },
  },
  {
    header: () => makeHeader('7D Vol', '7-day sponsorship volume in USD'),
    accessorKey: 'sevenDayVolume',
    cell: ({ getValue }) => (
      <span className={metricValueClass}>{getValue<string>()}</span>
    ),
    sortingFn: (rowA, rowB, columnId) => {
      return (
        parseCurrency(rowA.getValue(columnId)) -
        parseCurrency(rowB.getValue(columnId))
      );
    },
  },
  {
    header: () =>
      makeHeader(
        'Balance ƒ',
        'How balanced is the pool between ETH and the paired token.'
      ),
    accessorKey: 'rebalanceFactor',
    enableSorting: false,
    cell: ({ getValue }) => (
      <span className={metricValueClass}>{getValue<string>()}</span>
    ),
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
  const [sorting, setSorting] = useState<SortingState>([]);
  const dataset = useMemo(() => data, [data]);
  const table = useReactTable({
    data: dataset,
    columns,
    state: { sorting },
    onSortingChange: setSorting,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
  });

  const containerClasses = [
    'flex h-full w-full flex-col rounded-[2rem] border border-white/90 bg-white p-6 shadow-[0_25px_80px_rgba(15,23,42,0.025)]',
    className,
  ]
    .filter(Boolean)
    .join(' ');

  return (
    <div className={containerClasses}>
      {caption ? (
        <div className="mb-6 text-sm font-semibold uppercase tracking-[0.3em] text-slate-500">
          {caption}
        </div>
      ) : (
        <div className="mb-2" />
      )}

      <div className="min-h-0 flex-1 overflow-y-auto overflow-x-hidden">
        <table className="w-full table-fixed border-collapse text-left">
          <colgroup>
            <col className="w-[28%]" />
            <col className="w-[14%]" />
            <col className="w-[14%]" />
            <col className="w-[14%]" />
            <col className="w-[14%]" />
            <col className="w-[16%]" />
          </colgroup>
          <thead>
            {table.getHeaderGroups().map((headerGroup) => (
              <tr key={headerGroup.id} className="border-b border-slate-200/80">
                {headerGroup.headers.map((header) => (
                  <th
                    key={header.id}
                    className="px-3 pb-3 text-[0.7rem] font-semibold tracking-[0.18em] text-slate-500 sm:px-4">
                    {header.isPlaceholder ? null : header.column.getCanSort() ? (
                      <button
                        type="button"
                        onClick={header.column.getToggleSortingHandler()}
                        className="flex items-center gap-1 text-left">
                        {flexRender(
                          header.column.columnDef.header,
                          header.getContext()
                        )}
                        {header.column.getIsSorted() ? (
                          <span className="text-[0.6rem] text-slate-400">
                            {header.column.getIsSorted() === 'asc' ? '▲' : '▼'}
                          </span>
                        ) : null}
                      </button>
                    ) : (
                      flexRender(
                        header.column.columnDef.header,
                        header.getContext()
                      )
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
                  selectedPoolId && selectedPoolId === row.original.id
                    ? 'bg-indigo-50/70'
                    : 'hover:bg-slate-50/80',
                ]
                  .filter(Boolean)
                  .join(' ')}>
                {row.getVisibleCells().map((cell) => (
                  <td
                    className="px-3 py-4 text-sm text-slate-600 sm:px-4"
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
