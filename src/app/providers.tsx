'use client';

import { useState, useEffect } from 'react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { WagmiProvider, createConfig, http } from 'wagmi';
import { RainbowKitProvider, getDefaultWallets } from '@rainbow-me/rainbowkit';
import { supportedChains } from '@/utils/networks';
import '@rainbow-me/rainbowkit/styles.css';

// Подавляем unhandledrejection от сторонних расширений (Pocket Universe, Petra и др.)
// которые перехватывают wallet_revokePermissions и получают 403 от WalletConnect
if (typeof window !== 'undefined') {
  window.addEventListener('unhandledrejection', (e) => {
    const code = e.reason?.code;
    const msg = e.reason?.message ?? '';
    if (code === -32000 || msg.includes('Request failed with status code 403')) {
      e.preventDefault();
    }
  });
}

function makeConfig() {
  const projectId = process.env.NEXT_PUBLIC_WC_PROJECT_ID ?? '';
  const { connectors } = getDefaultWallets({
    appName: 'EIP-7702 Revoker',
    projectId,
  });
  return createConfig({
    chains: supportedChains as any,
    connectors,
    transports: Object.fromEntries(
      supportedChains.map((c) => [c.id, http(c.rpcUrls.default.http[0])])
    ),
  });
}

export function Providers({ children }: { children: React.ReactNode }) {
  const [wagmiConfig] = useState(makeConfig);
  const [queryClient] = useState(
    () =>
      new QueryClient({
        defaultOptions: {
          mutations: {
            onError: (error: unknown) => {
              if (
                error &&
                typeof error === 'object' &&
                'code' in error &&
                (error as any).code === -32000
              ) {
                return;
              }
              console.error(error);
            },
          },
        },
      }),
  );

  return (
    <WagmiProvider config={wagmiConfig}>
      <QueryClientProvider client={queryClient}>
        <RainbowKitProvider>
          {children}
        </RainbowKitProvider>
      </QueryClientProvider>
    </WagmiProvider>
  );
}