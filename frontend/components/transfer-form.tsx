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

type TransferFormState = {
  assetSymbol: string;
  amount: string;
  recipient: string;
  paymasterSymbol: string;
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
    assetSymbol: assetOptions[0]?.symbol ?? '',
    amount: '',
    recipient: '',
    paymasterSymbol: paymasterTokens[0]?.symbol ?? '',
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
  const estimatedFee = 12 * selectedPaymaster.feeRate;
  const canSubmit =
    Boolean(formState.recipient.trim()) &&
    amountNumber > 0 &&
    Boolean(selectedAsset);

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
        return 'Send asset';
    }
  })();
  const showButtonLabel = status === 'idle';
  const shouldAnimateButton = status === 'success' || status === 'error';
  const buttonFillTone =
    status === 'success'
      ? 'bg-emerald-400'
      : status === 'error'
        ? 'bg-rose-400'
        : '';
  const buttonToneClass = (() => {
    switch (status) {
      case 'loading':
        return 'bg-gradient-to-r from-slate-900/90 via-slate-800 to-slate-900/90 border border-white/20 backdrop-blur';
      case 'success':
        return 'bg-gradient-to-r from-emerald-300 via-emerald-400 to-teal-300 border border-emerald-200/60';
      case 'error':
        return 'bg-gradient-to-r from-rose-300 via-rose-400 to-orange-300 border border-rose-200/60';
      default:
        return 'bg-slate-900';
    }
  })();
  const showHalo = status !== 'idle';
  const buttonHaloTone =
    status === 'success'
      ? 'shadow-[0_0_30px_10px_rgba(16,185,129,0.35)]'
      : status === 'error'
        ? 'shadow-[0_0_30px_10px_rgba(244,63,94,0.35)]'
        : 'shadow-[0_0_35px_12px_rgba(148,163,184,0.25)]';
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
            <Card kicker="SENDING" className="lg:col-span-2">
              <div className="grid gap-3 sm:grid-cols-2">
                <LabeledField label="Asset">
                  <Select
                    value={formState.assetSymbol}
                    onChange={(value) =>
                      handleFieldChange('assetSymbol', value)
                    }
                    disabled={interactionLocked}>
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
                      disabled={interactionLocked}
                    />
                    <button
                      type="button"
                      onClick={handleMaxAmount}
                      disabled={interactionLocked}
                      className={[
                        'h-10 shrink-0 rounded-full border border-slate-200 px-3 text-xs font-semibold text-slate-700 transition sm:text-sm sm:px-4',
                        interactionLocked
                          ? 'cursor-not-allowed opacity-60'
                          : 'hover:border-slate-300',
                      ]
                        .filter(Boolean)
                        .join(' ')}>
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

            <Card kicker="Destination">
              <div className="space-y-3">
                <LabeledField label="Recipient">
                  <Input
                    type="text"
                    value={formState.recipient}
                    onChange={(event) => {
                      const nextValue = event.target.value;
                      handleFieldChange('recipient', nextValue);
                    }}
                    placeholder="0xA0CF...cE25"
                    className="font-mono text-xs tracking-tight text-slate-900 sm:text-sm py-2"
                    autoComplete="off"
                    spellCheck={false}
                    disabled={interactionLocked}
                  />
                </LabeledField>
              </div>
            </Card>

            <Card kicker="Paymaster funding">
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
                    disabled={interactionLocked}>
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
                    <span className="flex flex-col gap-0.5 font-semibold text-slate-900">
                      <span className="font-semibold tracking-tight">
                        {truncateMiddle(
                          resolvedRecipient ?? formState.recipient
                        )}
                      </span>
                      {resolvedRecipient &&
                        resolvedRecipient !== formState.recipient && (
                          <span className="text-[11px] text-end font-medium uppercase tracking-[0.2em] text-slate-400">
                            {formState.recipient}
                          </span>
                        )}
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
                      className="font-mono text-xs text-slate-900 underline decoration-dotted underline-offset-4 hover:text-slate-600">
                      {truncateMiddle(receiptHash)}
                    </a>
                  </SummaryRow>
                )}
              </dl>
              <div className="space-y-3">
                <button
                  type="submit"
                  aria-label={buttonLabel}
                  disabled={buttonDisabled}
                  className={[
                    'relative inline-flex h-12 w-full items-center justify-center overflow-hidden rounded-full border text-sm font-semibold text-white shadow-[0_18px_45px_rgba(15,23,42,0.25)] transition focus-visible:outline focus-visible:outline-offset-2 focus-visible:outline-slate-900',
                    buttonToneClass,
                    showHalo ? buttonHaloTone : '',
                    buttonMotionClass,
                    !interactionLocked && canSubmit ? 'hover:bg-slate-800' : '',
                    buttonDisabled ? 'cursor-not-allowed opacity-60' : '',
                    interactionLocked ? 'cursor-wait' : '',
                  ]
                    .filter(Boolean)
                    .join(' ')}>
                  <span className="relative z-10 flex items-center gap-2">
                    {buttonIcon}
                    {showButtonLabel && <span>{buttonLabel}</span>}
                  </span>
                  <span
                    className={[
                      'absolute inset-0 origin-center scale-x-0 rounded-full opacity-90',
                      shouldAnimateButton ? 'animate-button-fill' : '',
                      buttonFillTone,
                    ]
                      .filter(Boolean)
                      .join(' ')}
                  />
                </button>
              </div>
            </Card>
          </aside>
        </div>
      </form>
      <style jsx>{`
        @keyframes button-fill-expand {
          0% {
            transform: scaleX(0);
            opacity: 0.9;
          }
          50% {
            transform: scaleX(1);
            opacity: 0.85;
          }
          100% {
            transform: scaleX(1);
            opacity: 0;
          }
        }
        .animate-button-fill {
          animation: button-fill-expand 2s ease forwards;
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
