'use client';

import { usePathname } from 'next/navigation';
import { useMemo, type ReactNode } from 'react';
import { PrivyClientConfig, PrivyProvider } from '@privy-io/react-auth';

import { env } from '@/config/env';
import { ControlOrb } from '@/components/control-orb';

type ProvidersProps = {
  children: ReactNode;
};

export function Providers({ children }: ProvidersProps) {
  const pathname = usePathname();

  const privyConfig: PrivyClientConfig = useMemo(
    () => ({
      appearance: { theme: 'light' },
      loginMethods: ['passkey', 'wallet', 'email'],
      passkeys: {
        shouldUnenrollMfaOnUnlink: true,
        shouldUnlinkOnUnenrollMfa: true,
      },
    }),
    []
  );

  return (
    <PrivyProvider appId={env.privyAppId} config={privyConfig}>
      {children}

      {pathname != '/' && <ControlOrb />}
    </PrivyProvider>
  );
}
