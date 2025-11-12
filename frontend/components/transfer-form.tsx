'use client';

import {
  type FormEvent,
  type ReactNode,
  useEffect,
  useMemo,
  useState,
} from 'react';
import { Card } from '@/components/ui/card';
import { InfoBadge } from '@/components/ui/info-badge';
import { Input } from '@/components/ui/input';
import { LabeledField } from '@/components/ui/labeled-field';
import { Select } from '@/components/ui/select';
import { Spinner } from '@/components/ui/spinner';
import { LiquidGlassButton } from '@/components/ui/liquid-glass-button';

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
};

type NetworkOption = {
  value: string;
  label: string;
};

const assetOptions: AssetOption[] = [
  {
    symbol: 'USDC',
    name: 'USD Coin',
    network: 'Ethereum Mainnet',
    balance: 180.78,
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
    balance: 170.13,
  },
];

const paymasterTokens: PaymasterToken[] = [
  {
    symbol: 'DAI',
    name: 'MakerDAO DAI',
    network: 'Ethereum Mainnet',
    feeRate: 0.0015,
  },
  {
    symbol: 'USDC',
    name: 'USD Coin',
    network: 'Ethereum Mainnet',
    feeRate: 0.0015,
  },
  {
    symbol: 'OP',
    name: 'Optimism',
    network: 'Ethereum Mainnet',
    feeRate: 0.0035,
  },
];

const networkOptions: NetworkOption[] = [
  {
    value: 'ethereum-mainnet',
    label: 'Ethereum Mainnet',
  },
];

type TransferFormState = {
  assetSymbol: string;
  amount: string;
  recipient: string;
  paymasterSymbol: string;
  network: string;
};

type TransferStatus = 'idle' | 'loading' | 'success' | 'error';

const formatter = new Intl.NumberFormat('en-US', {
  minimumFractionDigits: 2,
  maximumFractionDigits: 4,
});

const EXPLORER_BASE_URL = 'https://etherscan.io/tx/';
const ENS_NAME_PATTERN = /^[a-z0-9](?:[a-z0-9-]{0,61}[a-z0-9])?\.eth$/i;
const MOCK_ENS_DIRECTORY: Record<string, string> = {
  'vitalik.eth': '0xd8dA6BF26964aF9D7eEd9e03E53415D37aA96045',
};

function createInitialFormState(): TransferFormState {
  return {
    assetSymbol: '',
    amount: '',
    recipient: '',
    paymasterSymbol: '',
    network: '',
  };
}

export function TransferForm() {
  const [formState, setFormState] = useState<TransferFormState>(
    createInitialFormState
  );
  const [status, setStatus] = useState<TransferStatus>('idle');
  const [receiptHash, setReceiptHash] = useState<string | null>(null);
  const [resolvedRecipient, setResolvedRecipient] = useState<string | null>(
    null
  );

  const selectedAsset = useMemo(
    () => assetOptions.find((asset) => asset.symbol === formState.assetSymbol),
    [formState.assetSymbol]
  );
  const selectedPaymaster = useMemo(
    () =>
      paymasterTokens.find(
        (token) => token.symbol === formState.paymasterSymbol
      ),
    [formState.paymasterSymbol]
  );
  const selectedNetwork = useMemo(
    () => networkOptions.find((network) => network.value === formState.network),
    [formState.network]
  );

  const amountNumber = Number(formState.amount) || 0;
  const estimatedFee = selectedPaymaster ? 12 * selectedPaymaster.feeRate : 0;
  const canSubmit =
    Boolean(formState.recipient.trim()) &&
    amountNumber > 0 &&
    Boolean(selectedAsset) &&
    Boolean(selectedPaymaster) &&
    Boolean(formState.network);

  const interactionLocked = status !== 'idle';
  const buttonDisabled = interactionLocked || !canSubmit;
  const buttonLabel = (() => {
    switch (status) {
      case 'loading':
        return 'Sending transfer…';
      case 'success':
        return 'Transfer sent';
      case 'error':
        return 'Transfer failed';
      default:
        return 'Send';
    }
  })();
  const showButtonLabel = status === 'idle';
  const buttonTone =
    status === 'success'
      ? 'positive'
      : status === 'error'
        ? 'negative'
        : 'default';
  const buttonMotionClass = status === 'loading' ? 'animate-button-pulse' : '';
  const buttonIcon = (() => {
    if (status === 'loading') {
      return <Spinner size="md" tone="light" />;
    }
    if (status === 'success') {
      return <SuccessIcon />;
    }
    if (status === 'error') {
      return <ErrorIcon />;
    }
    return null;
  })();

  const fieldSurfaceClass = 'border-white/30 bg-white/15';

  function handleFieldChange<T extends keyof TransferFormState>(
    field: T,
    value: TransferFormState[T]
  ) {
    setFormState((prev) => ({ ...prev, [field]: value }));
  }

  function handleMaxAmount() {
    if (!selectedAsset) return;
    handleFieldChange('amount', selectedAsset.balance.toString());
  }

  useEffect(() => {
    if (status === 'success' || status === 'error') {
      const timer = setTimeout(() => {
        setStatus('idle');
        setReceiptHash(null);
      }, 2000);
      return () => clearTimeout(timer);
    }
  }, [status]);

  useEffect(() => {
    let cancelled = false;
    const value = formState.recipient.trim();

    if (!value || !isEnsName(value)) {
      setResolvedRecipient(null);
      return () => {
        cancelled = true;
      };
    }

    async function resolveEns() {
      const resolved = await mockResolveEns(value);
      if (!cancelled) {
        setResolvedRecipient(resolved);
      }
    }

    resolveEns().catch(() => {
      if (!cancelled) {
        setResolvedRecipient(null);
      }
    });

    return () => {
      cancelled = true;
    };
  }, [formState.recipient]);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (!canSubmit || status !== 'idle') {
      return;
    }

    setStatus('loading');
    setReceiptHash(null);

    try {
      const result = await sendTransfer({
        asset: selectedAsset?.symbol ?? formState.assetSymbol,
        amount: formState.amount,
        recipient: formState.recipient,
        paymaster: selectedPaymaster?.symbol ?? formState.paymasterSymbol,
        network: formState.network,
      });
      setReceiptHash(result.hash);
      setStatus('success');
    } catch (error) {
      const message =
        error instanceof Error
          ? error.message
          : 'Unable to queue transfer right now.';
      setStatus('error');
      console.log('[sendTransfer] user-facing error', message);
    } finally {
      setFormState(createInitialFormState());
    }
  }

  return (
    <>
      <form
        onSubmit={handleSubmit}
        className="space-y-5"
        aria-busy={interactionLocked}>
        <div className="grid gap-5 lg:grid-cols-[minmax(0,2fr)_minmax(0,1fr)]">
          <div className="flex flex-col gap-5">
            <Card
              kicker="1. ASSET"
              className="reveal relative lg:col-span-2 overflow-hidden border border-emerald-200/60 bg-gradient-to-br from-emerald-200/35 via-white/15 to-teal-100/20 shadow-[0_10px_30px_rgba(5,10,25,0.18)] backdrop-blur-3xl animate-gradient-shift"
              kickerClassName="text-[10px] font-semibold uppercase tracking-[0.45em] text-emerald-500">
              <div className="grid gap-3 sm:grid-cols-2">
                <LabeledField label="Asset">
                  <Select
                    value={formState.assetSymbol}
                    onChange={(value) =>
                      handleFieldChange('assetSymbol', value)
                    }
                    disabled={interactionLocked}
                    className={fieldSurfaceClass}>
                    <option value="" disabled>
                      Select asset
                    </option>
                    {assetOptions.map((asset) => (
                      <option key={asset.symbol} value={asset.symbol}>
                        {asset.symbol}
                      </option>
                    ))}
                  </Select>
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
                      disabled={interactionLocked}
                      className={fieldSurfaceClass}
                    />
                    <LiquidGlassButton
                      type="button"
                      onClick={handleMaxAmount}
                      disabled={interactionLocked}
                      className="h-10 shrink-0 px-4 text-xs font-semibold sm:text-sm sm:px-5">
                      Max
                    </LiquidGlassButton>
                  </div>
                  <p className="ml-2 text-[0.7rem] font-semibold uppercase tracking-[0.18em] text-slate-500">
                    Available{' '}
                    <span className="ml-1 text-[0.95rem] font-medium text-slate-800/90 tracking-[0.01em] normal-case">
                      {selectedAsset
                        ? `${formatBalance(selectedAsset.balance)} ${selectedAsset.symbol}`
                        : '—'}
                    </span>
                  </p>
                </LabeledField>
              </div>
            </Card>

            <Card
              kicker="2. Destination"
              className="reveal relative overflow-hidden border border-indigo-200/60 bg-linear-to-br from-indigo-200/35 via-white/15 to-slate-100/20 shadow-[0_10px_30px_rgba(5,10,25,0.16)] backdrop-blur-3xl animate-gradient-shift"
              kickerClassName="text-[10px] font-semibold uppercase tracking-[0.45em] text-indigo-500">
              <div className="grid gap-3 sm:grid-cols-2">
                <LabeledField label="Network">
                  <Select
                    value={formState.network}
                    onChange={(value) => handleFieldChange('network', value)}
                    disabled={interactionLocked}
                    className={fieldSurfaceClass}>
                    <option value="" disabled>
                      Select network
                    </option>
                    {networkOptions.map((network) => (
                      <option key={network.value} value={network.value}>
                        {network.label}
                      </option>
                    ))}
                  </Select>
                </LabeledField>
                <LabeledField label="Recipient">
                  <Input
                    type="text"
                    value={formState.recipient}
                    onChange={(event) => {
                      const nextValue = event.target.value;
                      handleFieldChange('recipient', nextValue);
                    }}
                    placeholder="0xA0CF...cE25"
                    className={[
                      'font-mono text-xs tracking-tight text-slate-900 sm:text-sm py-2',
                      fieldSurfaceClass,
                    ].join(' ')}
                    autoComplete="off"
                    spellCheck={false}
                    disabled={interactionLocked}
                  />
                </LabeledField>
              </div>
            </Card>

            <Card
              kicker="3. Paymaster funding"
              className="reveal relative overflow-hidden border border-amber-200/60 bg-linear-to-br from-amber-200/40 via-white/15 to-orange-100/20 shadow-[0_10px_30px_rgba(5,10,25,0.15)] backdrop-blur-3xl animate-gradient-shift"
              kickerClassName="text-[10px] font-semibold uppercase tracking-[0.45em] text-amber-500">
              <div className="grid gap-3 sm:grid-cols-2">
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
                    }
                    disabled={interactionLocked}
                    className={fieldSurfaceClass}>
                    <option value="" disabled>
                      Select pay token
                    </option>
                    {paymasterTokens.map((token) => (
                      <option key={token.symbol} value={token.symbol}>
                        {token.symbol}
                      </option>
                    ))}
                  </Select>
                </LabeledField>

                <LabeledField label="Estimated fee">
                  <Input
                    type="text"
                    value={
                      selectedPaymaster && estimatedFee > 0
                        ? `${formatter.format(estimatedFee)} ${selectedPaymaster.symbol}`
                        : '—'
                    }
                    readOnly
                    disabled
                    className={[
                      fieldSurfaceClass,
                      'text-sm',
                      'disabled:opacity-100',
                    ].join(' ')}
                  />
                </LabeledField>
              </div>
            </Card>
          </div>

          <aside className="flex flex-col gap-4">
            <Card
              kicker="Transfer summary"
              title="Review before sending"
              className="summary-card reveal relative flex h-full flex-col overflow-hidden rounded-4xl border border-white/25 px-5 pb-5 pt-6 text-slate-900 shadow-[0_12px_35px_rgba(15,23,42,0.12)]"
              kickerClassName="text-[10px] font-semibold uppercase tracking-[0.45em] text-slate-500"
              bodyClassName="flex flex-1 flex-col justify-between gap-6 text-slate-900"
              unstyled>
              <dl className="space-y-4 text-sm text-slate-700 mt-2">
                <SummaryRow label="Asset">
                  {selectedAsset ? selectedAsset.symbol : '—'}
                </SummaryRow>
                <SummaryRow label="Network">
                  {selectedNetwork ? (
                    <span className=" text-slate-900">
                      {selectedNetwork.label}
                    </span>
                  ) : (
                    '—'
                  )}
                </SummaryRow>
                <SummaryRow label="Amount">
                  {formState.amount ? (
                    <span className=" text-slate-900">
                      {formState.amount} {selectedAsset?.symbol}
                    </span>
                  ) : (
                    '—'
                  )}
                </SummaryRow>
                <SummaryRow label="Recipient">
                  {formState.recipient ? (
                    <span className="flex flex-col gap-0.5  text-slate-900">
                      <span className=" tracking-tight text-slate-900">
                        {truncateMiddle(
                          resolvedRecipient ?? formState.recipient
                        )}
                      </span>
                      {resolvedRecipient &&
                        resolvedRecipient !== formState.recipient && (
                          <span className="text-[11px] text-end font-medium uppercase tracking-[0.2em] text-slate-500">
                            {formState.recipient}
                          </span>
                        )}
                    </span>
                  ) : (
                    '—'
                  )}
                </SummaryRow>
                <SummaryRow label="Paymaster token">
                  {selectedPaymaster ? selectedPaymaster.symbol : '—'}
                </SummaryRow>
                <SummaryRow label="Estimated fee">
                  {estimatedFee > 0 ? (
                    <span className=" text-slate-900">
                      {formatter.format(estimatedFee)}{' '}
                      {selectedPaymaster?.symbol}
                    </span>
                  ) : (
                    '—'
                  )}
                </SummaryRow>
                {receiptHash && (
                  <SummaryRow label="Receipt hash">
                    <a
                      href={`${EXPLORER_BASE_URL}${receiptHash}`}
                      target="_blank"
                      rel="noreferrer"
                      className="font-mono text-xs text-slate-900 underline decoration-dotted underline-offset-4 hover:text-emerald-500">
                      {truncateMiddle(receiptHash)}
                    </a>
                  </SummaryRow>
                )}
              </dl>
              <div className="space-y-3">
                <LiquidGlassButton
                  type="submit"
                  aria-label={buttonLabel}
                  disabled={buttonDisabled}
                  tone={buttonTone}
                  className={[
                    'flex h-12 w-full items-center justify-center gap-2 text-sm',
                    buttonMotionClass,
                    interactionLocked ? 'cursor-wait' : '',
                  ]
                    .filter(Boolean)
                    .join(' ')}>
                  {buttonIcon}
                  {showButtonLabel && <span>{buttonLabel}</span>}
                </LiquidGlassButton>
              </div>
            </Card>
          </aside>
        </div>
      </form>
      <style jsx>{`
        @keyframes gradient-shift {
          0% {
            background-position: 0% 50%;
          }
          50% {
            background-position: 100% 50%;
          }
          100% {
            background-position: 0% 50%;
          }
        }
        .animate-gradient-shift {
          animation: gradient-shift 12s ease-in-out infinite;
          background-size: 220% 220%;
        }
        @keyframes summary-gradient {
          0% {
            background-position: 0% 50%;
          }
          50% {
            background-position: 100% 50%;
          }
          100% {
            background-position: 0% 50%;
          }
        }
        :global(.summary-card) {
          background-image:
            linear-gradient(
              135deg,
              rgba(59, 130, 246, 0.18),
              rgba(129, 140, 248, 0.16),
              rgba(16, 185, 129, 0.15)
            ),
            radial-gradient(
              circle at 20% 20%,
              rgba(255, 255, 255, 0.08),
              transparent 45%
            );
          background-size: 240% 240%;
          animation: summary-gradient 22s ease-in-out infinite;
          backdrop-filter: blur(26px);
          box-shadow:
            inset 0 1px 0 rgba(255, 255, 255, 0.18),
            0 12px 35px rgba(15, 23, 42, 0.18);
        }
        :global(.summary-card.reveal) {
          animation:
            summary-gradient 22s ease-in-out infinite,
            rowReveal 0.7s ease forwards;
        }
        @keyframes summary-shine {
          0% {
            transform: translate3d(-20%, -20%, 0) rotate(20deg);
            opacity: 0.15;
          }
          50% {
            transform: translate3d(10%, 10%, 0) rotate(20deg);
            opacity: 0.3;
          }
          100% {
            transform: translate3d(-20%, -20%, 0) rotate(20deg);
            opacity: 0.15;
          }
        }
        :global(.summary-card)::after {
          content: '';
          position: absolute;
          inset: 4px;
          border-radius: inherit;
          background: linear-gradient(
            130deg,
            rgba(255, 255, 255, 0.5) 0%,
            rgba(255, 255, 255, 0.12) 45%,
            transparent 75%
          );
          mix-blend-mode: screen;
          pointer-events: none;
          animation: summary-shine 12s ease-in-out infinite;
          filter: blur(0.5px);
        }
        :global(.summary-card) > * {
          position: relative;
          z-index: 1;
        }
        @keyframes button-pulse {
          0% {
            transform: scale(1);
          }
          50% {
            transform: scale(1.03);
          }
          100% {
            transform: scale(1);
          }
        }
        .animate-button-pulse {
          animation: button-pulse 1.2s ease-in-out infinite;
        }
      `}</style>
    </>
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
  tone = 'dark',
}: {
  label: string;
  children: ReactNode;
  tone?: 'dark' | 'light';
}) {
  const labelClass =
    tone === 'light'
      ? 'text-[10px] font-semibold uppercase tracking-[0.25em] text-white/70'
      : 'text-[10px] font-semibold uppercase tracking-[0.25em] text-slate-500';
  const isDash = typeof children === 'string' && children.trim() === '—';
  const baseValueClass = 'text-[0.95rem] font-medium tracking-[0.01em]';
  const toneColorClass = tone === 'light' ? 'text-white' : 'text-slate-800/90';
  const dashColorClass =
    tone === 'light' ? 'text-white/70 text-xs' : 'text-slate-500';
  const valueClass = [baseValueClass, isDash ? dashColorClass : toneColorClass]
    .filter(Boolean)
    .join(' ');
  return (
    <div className="flex items-center justify-between gap-3">
      <span className={labelClass}>{label}</span>
      <span className={valueClass}>{children}</span>
    </div>
  );
}

function isEnsName(value: string) {
  return ENS_NAME_PATTERN.test(value.trim().toLowerCase());
}

async function mockResolveEns(name: string) {
  await sleep(600);
  return MOCK_ENS_DIRECTORY[name.toLowerCase()] ?? null;
}

function SuccessIcon() {
  return (
    <svg
      className="h-5 w-5 text-white drop-shadow-sm"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true">
      <path d="M5 13l4 4L19 7" />
      <circle cx="12" cy="12" r="9" opacity="0.2" fill="currentColor" />
    </svg>
  );
}

function ErrorIcon() {
  return (
    <svg
      className="h-5 w-5 text-white drop-shadow-sm"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true">
      <circle cx="12" cy="12" r="9" />
      <path d="M12 8v5" />
      <path d="M12 16h.01" />
    </svg>
  );
}

type SendTransferPayload = {
  asset: string;
  amount: string;
  recipient: string;
  paymaster: string;
  network: string;
};

async function sendTransfer(
  payload: SendTransferPayload
): Promise<{ hash: string }> {
  console.log('[sendTransfer] payload', payload);
  await sleep(3000);

  const shouldFail = Math.random() < 0.25;
  if (shouldFail) {
    const error = new Error('Paymaster rejected this transfer.');
    console.log('[sendTransfer] error', error);
    throw error;
  }

  const hash = generateMockHash();
  console.log('[sendTransfer] success', hash);
  return { hash };
}

function sleep(ms: number) {
  return new Promise<void>((resolve) => {
    setTimeout(resolve, ms);
  });
}

function generateMockHash() {
  if (typeof crypto !== 'undefined' && 'randomUUID' in crypto) {
    return `0x${crypto.randomUUID().replace(/-/g, '').padEnd(64, '0').slice(0, 64)}`;
  }

  const fallback = Array.from({ length: 64 }, () =>
    Math.floor(Math.random() * 16).toString(16)
  ).join('');
  return `0x${fallback}`;
}
