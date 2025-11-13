'use client';

import { usePathname } from 'next/navigation';
import { mainnet, sepolia } from 'viem/chains';
import { useMemo, type ReactNode } from 'react';
import { createPublicClient, http, type Chain } from 'viem';
import { PrivyClientConfig, PrivyProvider } from '@privy-io/react-auth';

import { env } from '@/config/env';
import { ControlOrb } from '@/components/control-orb';

type ProvidersProps = {
  children: ReactNode;
};

const resolveChain = (): Chain => {
  const supportedChains: Chain[] = [mainnet, sepolia];
  const numericId = Number(env.chainId);
  return supportedChains.find((chain) => chain.id === numericId) ?? mainnet;
};

const resolveRpc = () => {
  const fallbackUrl = mainnet.rpcUrls.default.http[0];
  return http(env.rpcUrl ?? fallbackUrl);
};

export const client = createPublicClient({
  chain: resolveChain(),
  transport: resolveRpc(),
});

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
