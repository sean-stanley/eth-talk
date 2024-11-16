'use client';

import { OnchainKitProvider } from '@coinbase/onchainkit';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { type ReactNode, useState, useEffect } from 'react';
import {
  http,
  cookieStorage,
  createConfig,
  createStorage,
  type State,
  WagmiProvider,
} from 'wagmi';
import { base, baseSepolia } from 'wagmi/chains';
import { coinbaseWallet } from 'wagmi/connectors';

import { ConfigProvider } from './context/ConfigContext';
import { getFromNillion } from './nillion';

const config = createConfig({
  chains: [baseSepolia],
  connectors: [
    coinbaseWallet({
      appName: process.env.NEXT_PUBLIC_ONCHAINKIT_PROJECT_NAME,
      preference: 'smartWalletOnly',
      // @ts-ignore
      keysUrl: 'https://keys-dev.coinbase.com/connect',
    }),
  ],
  storage: createStorage({
    storage: cookieStorage,
  }),
  ssr: true,
  transports: {
    [baseSepolia.id]: http(),
  },
});

export function Providers(props: {
  children: ReactNode;
  initialState?: State;
}) {
  const [queryClient] = useState(() => new QueryClient());
  const [apiKey, setApiKey] = useState<string>('');
  useEffect(() => {
    const fetchApiKey = async () => {
      try {
        const key = await getFromNillion(
          'f5e028fe-b69b-41b7-b1c1-171ee7c191ea',
          'ON_CHAIN_KIT_KEY'
        );
        setApiKey(key.secret);
      } catch (error) {
        console.error('Error fetching Nillion API key:', error);
      }
    };

    fetchApiKey();
  }, []);

  return (
    <WagmiProvider config={config} initialState={props.initialState}>
      <ConfigProvider config={config}>
        <QueryClientProvider client={queryClient}>
          <OnchainKitProvider
            apiKey={apiKey}
            // @ts-ignore
            chain={base}
            config={{
              appearance: {
                mode: 'auto',
                theme: 'base',
              },
            }}
          >
            {props.children}
          </OnchainKitProvider>
        </QueryClientProvider>
      </ConfigProvider>
    </WagmiProvider>
  );
}
