'use client';

import { PrivyProvider } from '@privy-io/react-auth';
import type { ReactNode } from 'react';
import { ControlOrb } from '@/components/control-orb';
import { usePathname } from 'next/navigation';

type ProvidersProps = {
  children: ReactNode;
};

export function Providers({ children }: ProvidersProps) {
  const pathname = usePathname();
  const privyAppId = process.env.NEXT_PUBLIC_PRIVY_APP_ID;

  if (!privyAppId) {
    if (process.env.NODE_ENV !== 'production') {
      console.warn(
        'Privy is not initialized because NEXT_PUBLIC_PRIVY_APP_ID is missing.'
      );
    }
    return children;
  }

  return (
    <PrivyProvider
      appId={privyAppId}
      config={{
        appearance: { theme: 'light' },
        loginMethods: ['passkey', 'wallet', 'email'],
        passkeys: {
          shouldUnenrollMfaOnUnlink: true,
          shouldUnlinkOnUnenrollMfa: true,
        },
      }}>
      {children}

      {pathname != '/' && <ControlOrb />}
    </PrivyProvider>
  );
}
