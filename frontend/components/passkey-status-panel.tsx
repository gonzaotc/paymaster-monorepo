'use client';

import {
  useLinkWithPasskey,
  useLoginWithPasskey,
  usePrivy,
} from '@privy-io/react-auth';
import type { PasskeyFlowState } from '@privy-io/react-auth';
import { useCallback, useMemo, useState } from 'react';

type PasskeyStatusPanelProps = {
  enabled: boolean;
};

type Feedback = {
  tone: 'success' | 'error';
  message: string;
};

export function PasskeyStatusPanel({ enabled }: PasskeyStatusPanelProps) {
  if (!enabled) {
    return (
      <div className="rounded-[1.25rem] border border-dashed border-slate-200 bg-white/70 p-5 text-sm text-slate-600">
        <p className="font-semibold text-slate-800">Passkey preview disabled</p>
        <p className="mt-2 text-xs">
          Set{' '}
          <code className="font-mono text-[11px]">
            NEXT_PUBLIC_PRIVY_APP_ID
          </code>{' '}
          to enable the Privy SDK and test passkey logins locally.
        </p>
      </div>
    );
  }

  return <PrivyBackedPasskeyPanel />;
}

function PrivyBackedPasskeyPanel() {
  const { ready, authenticated, user, logout, login } = usePrivy();
  const { loginWithPasskey, state: loginState } = useLoginWithPasskey();
  const { linkWithPasskey, state: linkState } = useLinkWithPasskey();
  const [feedback, setFeedback] = useState<Feedback | null>(null);

  const passkeyBusy = isPasskeyFlowBusy(loginState.status);
  const linkBusy = isPasskeyFlowBusy(linkState.status);

  const passkeyStateLabel = useMemo(
    () => describePasskeyState(loginState),
    [loginState]
  );

  const linkStateLabel = useMemo(
    () => describePasskeyState(linkState),
    [linkState]
  );

  const linkedPasskeys =
    user?.linkedAccounts?.filter((account) => account.type === 'passkey')
      .length ?? 0;

  const handleWalletLogin = useCallback(() => {
    setFeedback(null);

    login({
      loginMethods: ['wallet'],
      walletChainType: 'ethereum-only',
    });
  }, [login]);

  const handleLinkPasskey = useCallback(async () => {
    setFeedback(null);

    if (!authenticated) {
      setFeedback({
        tone: 'error',
        message: 'Sign in with an Ethereum wallet before creating a passkey.',
      });
      return;
    }

    try {
      await linkWithPasskey();
      setFeedback({
        tone: 'success',
        message: 'Passkey linked to your Privy identity on this device.',
      });
    } catch (error) {
      const message =
        error instanceof Error ? error.message : 'Unable to create passkey.';
      setFeedback({
        tone: 'error',
        message,
      });
    }
  }, [authenticated, linkWithPasskey]);

  const handlePasskeyLogin = useCallback(async () => {
    setFeedback(null);

    try {
      if (authenticated) {
        await logout();
      }
      await loginWithPasskey();
      setFeedback({
        tone: 'success',
        message: 'Passkey verified. Privy session active.',
      });
    } catch (error) {
      const message =
        error instanceof Error ? error.message : 'Unexpected passkey error.';
      setFeedback({
        tone: 'error',
        message,
      });
    }
  }, [authenticated, loginWithPasskey, logout]);

  const handleLogout = useCallback(async () => {
    setFeedback(null);
    await logout();
    setFeedback({
      tone: 'success',
      message: 'Privy session cleared.',
    });
  }, [logout]);

  return (
    <div className="rounded-[1.25rem] border border-white/90 bg-white p-5 shadow-[0_12px_40px_rgba(15,23,42,0.06)]">
      <div className="flex flex-col gap-4">
        <div className="flex flex-col gap-1">
          <p className="text-xs font-semibold uppercase tracking-[0.4em] text-slate-500">
            Passkey Login
          </p>
          <p className="text-lg font-semibold text-slate-900">
            Privy connection probe
          </p>
          <p className="text-sm text-slate-500">
            Use the button below to trigger the passkey-only Privy flow and
            inspect state.
          </p>
        </div>

        <dl className="grid gap-3 text-sm sm:grid-cols-3">
          <StatusItem
            label="SDK status"
            value={ready ? 'Ready' : 'Bootstrapping'}
          />
          <StatusItem
            label="Session"
            value={authenticated ? 'Authenticated' : 'Signed out'}
          />
          <StatusItem label="Linked passkeys" value={`${linkedPasskeys}`} />
        </dl>

        <div className="rounded-2xl bg-slate-50 p-4 text-xs text-slate-500">
          <div className="space-y-1">
            <p className="font-medium text-slate-700">
              Passkey login:{' '}
              <span className="text-slate-900">{passkeyStateLabel}</span>
            </p>
            <p className="font-medium text-slate-700">
              Passkey creation:{' '}
              <span className="text-slate-900">{linkStateLabel}</span>
            </p>
          </div>
          {feedback && (
            <p
              className={`mt-2 ${
                feedback.tone === 'success'
                  ? 'text-emerald-600'
                  : 'text-rose-600'
              }`}>
              {feedback.message}
            </p>
          )}
        </div>

        <div className="grid gap-3 sm:grid-cols-2">
          <ActionButton
            onClick={handleWalletLogin}
            disabled={!ready || passkeyBusy || linkBusy}
            label="Sign in with Ethereum wallet"
          />
          <ActionButton
            onClick={handleLinkPasskey}
            disabled={!ready || !authenticated || linkBusy}
            label={
              linkBusy
                ? 'Awaiting Touch ID…'
                : 'Create a passkey on this device'
            }
            variant="ghost"
          />
          <ActionButton
            onClick={handlePasskeyLogin}
            disabled={!ready || passkeyBusy}
            label={passkeyBusy ? 'Awaiting passkey…' : 'Test passkey login'}
          />
          <ActionButton
            onClick={handleLogout}
            disabled={!authenticated}
            label="Sign out of Privy"
            variant="ghost"
          />
        </div>
      </div>
    </div>
  );
}

function ActionButton({
  label,
  onClick,
  disabled,
  variant = 'default',
}: {
  label: string;
  onClick: () => void | Promise<void>;
  disabled?: boolean;
  variant?: 'default' | 'ghost';
}) {
  const baseClasses =
    'inline-flex h-11 items-center justify-center rounded-full px-6 text-sm font-semibold transition disabled:cursor-not-allowed disabled:bg-slate-200 disabled:text-slate-500';
  const palette =
    variant === 'ghost'
      ? 'border border-slate-200 bg-white text-slate-900 hover:bg-slate-50'
      : 'bg-slate-900 text-white hover:bg-slate-800';

  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      className={`${baseClasses} ${palette}`}>
      {label}
    </button>
  );
}

function StatusItem({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-2xl border border-slate-100 bg-white/80 p-3 shadow-inner shadow-slate-100">
      <dt className="text-[10px] font-semibold uppercase tracking-[0.4em] text-slate-400">
        {label}
      </dt>
      <dd className="mt-1 text-base font-semibold text-slate-900">{value}</dd>
    </div>
  );
}

function isPasskeyFlowBusy(status: PasskeyFlowState['status']) {
  return (
    status === 'generating-challenge' ||
    status === 'awaiting-passkey' ||
    status === 'submitting-response'
  );
}

function describePasskeyState(state: PasskeyFlowState) {
  switch (state.status) {
    case 'generating-challenge':
      return 'Generating challenge';
    case 'awaiting-passkey':
      return 'Waiting for device approval';
    case 'submitting-response':
      return 'Verifying credential';
    case 'done':
      return 'Complete';
    case 'error':
      return state.error?.message ?? 'Passkey error';
    default:
      return 'Idle';
  }
}
