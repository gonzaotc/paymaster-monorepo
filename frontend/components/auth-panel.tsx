'use client';

import {
  useLinkWithPasskey,
  useLoginWithPasskey,
  usePrivy,
} from '@privy-io/react-auth';
import type { PasskeyFlowState } from '@privy-io/react-auth';
import { useCallback, useEffect, useState } from 'react';
import { LiquidGlassButton } from '@/components/ui/liquid-glass-button';

type AuthPanelProps = {
  enabled: boolean;
};

type Feedback = {
  tone: 'success' | 'error';
  message: string;
};

export function AuthPanel({ enabled }: AuthPanelProps) {
  if (!enabled) {
    return (
      <div className="rounded-[1.25rem] border border-dashed border-slate-200 bg-white/70 p-5 text-sm text-slate-600">
        <p className="font-semibold text-slate-800">Privy disabled</p>
        <p className="mt-2 text-xs">
          Set{' '}
          <code className="font-mono text-[11px]">
            NEXT_PUBLIC_PRIVY_APP_ID
          </code>{' '}
          to enable authentication locally.
        </p>
      </div>
    );
  }

  return <PrivyBackedAuthPanel />;
}

function PrivyBackedAuthPanel() {
  const { ready, authenticated, login, logout } = usePrivy();
  const { loginWithPasskey } = useLoginWithPasskey();
  const { linkWithPasskey, state: linkState } = useLinkWithPasskey();
  const [feedback, setFeedback] = useState<Feedback | null>(null);
  const [autoLinkRequested, setAutoLinkRequested] = useState(false);

  const linkBusy = isPasskeyFlowBusy(linkState.status);

  const linkPasskey = useCallback(async () => {
    setFeedback(null);

    if (!authenticated) {
      setFeedback({
        tone: 'error',
        message: 'Sign in with an Ethereum wallet before creating a passkey.',
      });
      return false;
    }

    try {
      await linkWithPasskey();
      setFeedback({
        tone: 'success',
        message: 'Touch ID opened automatically to link this device.',
      });
      return true;
    } catch (error) {
      const message =
        error instanceof Error ? error.message : 'Unable to create passkey.';
      setFeedback({
        tone: 'error',
        message,
      });
      return false;
    }
  }, [authenticated, linkWithPasskey]);

  const handleWalletLogin = useCallback(async () => {
    setFeedback(null);

    try {
      await login({
        loginMethods: ['wallet'],
        walletChainType: 'ethereum-only',
      });
      setAutoLinkRequested(true);
    } catch (error) {
      setAutoLinkRequested(false);
      const message =
        error instanceof Error
          ? error.message
          : 'Unable to start wallet login.';
      setFeedback({
        tone: 'error',
        message,
      });
    }
  }, [login]);

  const handlePasskeyLogin = useCallback(async () => {
    setFeedback(null);

    try {
      await loginWithPasskey();
      setFeedback({
        tone: 'success',
        message: 'Passkey verified. Session active.',
      });
    } catch (error) {
      const message =
        error instanceof Error ? error.message : 'Unexpected passkey error.';
      setFeedback({
        tone: 'error',
        message,
      });
    }
  }, [loginWithPasskey]);

  const handleLogout = useCallback(async () => {
    setFeedback(null);
    await logout();
    setAutoLinkRequested(false);
    setFeedback({
      tone: 'success',
      message: 'Session cleared.',
    });
  }, [logout]);

  useEffect(() => {
    if (!autoLinkRequested || !authenticated) {
      return;
    }
    if (linkBusy) {
      return;
    }

    let cancelled = false;
    (async () => {
      await linkPasskey();
      if (!cancelled) {
        setAutoLinkRequested(false);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [autoLinkRequested, authenticated, linkBusy, linkPasskey]);

  return (
    <div className="flex h-full flex-col gap-6">
      <div className="mt-auto">
        {authenticated ? (
          <LiquidGlassButton
            type="button"
            onClick={handleLogout}
            disabled={!ready}
            tone="negative"
            className="w-full">
            Sign out
          </LiquidGlassButton>
        ) : (
          <div className="grid gap-3 sm:grid-cols-2">
            <LiquidGlassButton
              type="button"
              onClick={handleWalletLogin}
              disabled={!ready || linkBusy}
              className="w-full">
              {linkBusy ? 'Awaiting Touch ID…' : 'Sign in with wallet'}
            </LiquidGlassButton>
            <LiquidGlassButton
              type="button"
              onClick={handlePasskeyLogin}
              disabled={!ready}
              tone="positive"
              className="w-full">
              Login with passkey
            </LiquidGlassButton>
          </div>
        )}
      </div>
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
