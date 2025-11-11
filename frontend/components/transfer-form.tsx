'use client';

import { type FormEvent, type ReactNode, useMemo, useState } from 'react';
import { Card } from '@/components/ui/card';
import { InfoBadge } from '@/components/ui/info-badge';
import { Input } from '@/components/ui/input';
import { LabeledField } from '@/components/ui/labeled-field';
import { Select } from '@/components/ui/select';

type AssetOption = {
  symbol: string;
  name: string;
  network: string;
  balance: number;
};

type PaymasterToken = {
  symbol: string;
  name: string;
  network: string;
  feeRate: number;
  liquidity: string;
};

const assetOptions: AssetOption[] = [
  {
    symbol: 'USDC',
    name: 'USD Coin',
    network: 'Ethereum Mainnet',
    balance: 48250.78,
  },
  {
    symbol: 'WETH',
    name: 'Wrapped Ether',
    network: 'Ethereum Mainnet',
    balance: 12.045,
  },
  {
    symbol: 'DAI',
    name: 'MakerDAO DAI',
    network: 'Ethereum Mainnet',
    balance: 1570.13,
  },
];

const paymasterTokens: PaymasterToken[] = [
  {
    symbol: 'ETH',
    name: 'Ether',
    network: 'Ethereum Mainnet',
    feeRate: 0.002,
    liquidity: 'Deep',
  },
  {
    symbol: 'USDC',
    name: 'USD Coin',
    network: 'Ethereum Mainnet',
    feeRate: 0.0015,
    liquidity: 'Programmatic',
  },
  {
    symbol: 'OP',
    name: 'Optimism',
    network: 'Ethereum Mainnet',
    feeRate: 0.0035,
    liquidity: 'Pool-backed',
  },
];

type TransferFormState = {
  assetSymbol: string;
  amount: string;
  recipient: string;
  paymasterSymbol: string;
};

const formatter = new Intl.NumberFormat('en-US', {
  minimumFractionDigits: 2,
  maximumFractionDigits: 4,
});

export function TransferForm() {
  const [formState, setFormState] = useState<TransferFormState>({
    assetSymbol: assetOptions[0]?.symbol ?? '',
    amount: '',
    recipient: '',
    paymasterSymbol: paymasterTokens[0]?.symbol ?? '',
  });
  const [feedback, setFeedback] = useState<string | null>(null);

  const selectedAsset = useMemo(
    () =>
      assetOptions.find((asset) => asset.symbol === formState.assetSymbol) ??
      assetOptions[0],
    [formState.assetSymbol]
  );
  const selectedPaymaster = useMemo(
    () =>
      paymasterTokens.find(
        (token) => token.symbol === formState.paymasterSymbol
      ) ?? paymasterTokens[0],
    [formState.paymasterSymbol]
  );

  const amountNumber = Number(formState.amount) || 0;
  const estimatedFee = amountNumber * selectedPaymaster.feeRate;
  const canSubmit =
    Boolean(formState.recipient.trim()) &&
    amountNumber > 0 &&
    Boolean(selectedAsset);

  function handleFieldChange<T extends keyof TransferFormState>(
    field: T,
    value: TransferFormState[T]
  ) {
    setFeedback(null);
    setFormState((prev) => ({ ...prev, [field]: value }));
  }

  function handleMaxAmount() {
    if (!selectedAsset) return;
    handleFieldChange('amount', selectedAsset.balance.toString());
  }

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (!canSubmit) {
      setFeedback('Provide a recipient and an amount to queue the transfer.');
      return;
    }

    setFeedback(
      `Queued ${formState.amount} ${selectedAsset.symbol} to ${
        formState.recipient
      } using ${selectedPaymaster.symbol} for gas.`
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      <div className="grid gap-5 lg:grid-cols-[minmax(0,2fr)_minmax(0,1fr)]">
        <div className="flex flex-col gap-5">
          <Card kicker="1. Source asset" className="lg:col-span-2">
            <div className="grid gap-3 sm:grid-cols-2 pt-1">
              <LabeledField label="Asset">
                <Select
                  value={formState.assetSymbol}
                  onChange={(value) => handleFieldChange('assetSymbol', value)}>
                  {assetOptions.map((asset) => (
                    <option key={asset.symbol} value={asset.symbol}>
                      {asset.symbol}
                    </option>
                  ))}
                </Select>
                <p className="text-xs text-slate-500">
                  Network:{' '}
                  <span className="font-semibold text-slate-900">
                    {selectedAsset?.network}
                  </span>
                </p>
              </LabeledField>

              <LabeledField label="Amount">
                <div className="flex flex-wrap items-center gap-2 sm:flex-nowrap">
                  <Input
                    type="number"
                    min="0"
                    step="any"
                    value={formState.amount}
                    onChange={(event) =>
                      handleFieldChange('amount', event.target.value)
                    }
                    placeholder="0.00"
                  />
                  <button
                    type="button"
                    onClick={handleMaxAmount}
                    className="h-10 shrink-0 rounded-full border border-slate-200 px-3 text-xs font-semibold text-slate-700 transition hover:border-slate-300 sm:text-sm sm:px-4">
                    Max
                  </button>
                </div>
                <p className="text-xs text-slate-500">
                  Available:{' '}
                  <span className="font-semibold text-slate-900">
                    {formatBalance(selectedAsset?.balance ?? 0)}{' '}
                    {selectedAsset?.symbol}
                  </span>
                </p>
              </LabeledField>
            </div>
          </Card>

          <Card kicker="2. Destination">
            <div className="space-y-3 pt-1">
              <LabeledField label="Recipient address">
                <Input
                  type="text"
                  value={formState.recipient}
                  onChange={(event) =>
                    handleFieldChange('recipient', event.target.value)
                  }
                  placeholder="0xA0CF...cE25"
                  className="font-mono text-xs tracking-tight text-slate-900 sm:text-sm py-2"
                  autoComplete="off"
                  spellCheck={false}
                />
              </LabeledField>
            </div>
          </Card>

          <Card kicker="3. Paymaster funding">
            <div className="grid gap-3 sm:grid-cols-2 pt-1">
              <LabeledField
                label={
                  <span className="flex items-center gap-2">
                    Pay with
                    <InfoBadge content="The paymaster token will be spent to settle gas for this transfer." />
                  </span>
                }>
                <Select
                  value={formState.paymasterSymbol}
                  onChange={(value) =>
                    handleFieldChange('paymasterSymbol', value)
                  }>
                  {paymasterTokens.map((token) => (
                    <option key={token.symbol} value={token.symbol}>
                      {token.symbol}
                    </option>
                  ))}
                </Select>
              </LabeledField>

              <LabeledField label="Estimated fee">
                <div className="rounded-[1.25rem] border border-white/80 bg-white/90 px-4 py-3 shadow-inner shadow-slate-100">
                  <p className="text-sm font-semibold text-slate-900">
                    {estimatedFee > 0
                      ? `${formatter.format(estimatedFee)} ${
                          selectedPaymaster.symbol
                        }`
                      : '—'}
                  </p>
                  <p className="text-xs text-slate-500">
                    {formatter.format(selectedPaymaster.feeRate * 100)}% of the
                    transfer amount
                  </p>
                </div>
              </LabeledField>
            </div>
          </Card>
        </div>

        <aside className="flex flex-col gap-4">
          <Card
            kicker="Transfer summary"
            title="Review before sending"
            className="flex h-full flex-col"
            bodyClassName="flex flex-1 flex-col justify-between gap-6">
            <dl className="space-y-3 text-sm text-slate-600">
              <SummaryRow label="Asset">
                <span className="font-semibold text-slate-900">
                  {selectedAsset?.symbol}
                </span>{' '}
                <span className="text-slate-500">
                  ({selectedAsset?.network})
                </span>
              </SummaryRow>
              <SummaryRow label="Amount">
                {formState.amount ? (
                  <span className="font-semibold text-slate-900">
                    {formState.amount} {selectedAsset?.symbol}
                  </span>
                ) : (
                  '—'
                )}
              </SummaryRow>
              <SummaryRow label="Recipient">
                {formState.recipient ? (
                  <span className="font-semibold text-slate-900">
                    {truncateMiddle(formState.recipient)}
                  </span>
                ) : (
                  '—'
                )}
              </SummaryRow>
              <SummaryRow label="Paymaster token">
                <span className="font-semibold text-slate-900">
                  {selectedPaymaster?.symbol}
                </span>
              </SummaryRow>
              <SummaryRow label="Estimated fee">
                {estimatedFee > 0 ? (
                  <span className="font-semibold text-slate-900">
                    {formatter.format(estimatedFee)} {selectedPaymaster?.symbol}
                  </span>
                ) : (
                  '—'
                )}
              </SummaryRow>
            </dl>
            <div className="space-y-3">
              <button
                type="submit"
                disabled={!canSubmit}
                className="inline-flex h-12 w-full items-center justify-center rounded-full bg-slate-900 text-sm font-semibold text-white shadow-[0_18px_45px_rgba(15,23,42,0.25)] transition hover:bg-slate-800 disabled:cursor-not-allowed disabled:bg-slate-300">
                Send asset
              </button>
              {feedback && (
                <p className="text-xs font-medium text-slate-600">{feedback}</p>
              )}
            </div>
          </Card>
        </aside>
      </div>
    </form>
  );
}

function formatBalance(value: number) {
  if (value >= 1000) {
    return new Intl.NumberFormat('en-US', {
      notation: 'compact',
      maximumFractionDigits: 2,
    }).format(value);
  }
  return formatter.format(value);
}

function truncateMiddle(value: string) {
  if (value.length <= 12) {
    return value;
  }
  return `${value.slice(0, 6)}…${value.slice(-4)}`;
}

function SummaryRow({
  label,
  children,
}: {
  label: string;
  children: ReactNode;
}) {
  return (
    <div className="flex items-center justify-between gap-3">
      <span className="text-[10px] font-semibold uppercase tracking-[0.25em] text-slate-400">
        {label}
      </span>
      <span className="text-sm font-medium text-slate-700">{children}</span>
    </div>
  );
}
