'use client';

import { useCallback, useState } from 'react';
import { CoinbaseWalletSDK } from '@coinbase/wallet-sdk';
import { CoinbaseWalletLogo } from './CoinbaseWalletLogo';

const buttonStyles = {
  background: 'transparent',
  border: '1px solid transparent',
  boxSizing: 'border-box' as const,
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'space-between',
  width: 200,
  fontFamily: 'Arial, sans-serif',
  fontWeight: 'bold',
  fontSize: 18,
  backgroundColor: '#0052FF',
  paddingLeft: 15,
  paddingRight: 30,
  borderRadius: 10,
};

const sdk = new CoinbaseWalletSDK({
  appName: 'My Dapp',
  appLogoUrl: 'https://example.com/logo.png',
  appChainIds: [84532], // Modify the chain ID as needed
});

const provider = sdk.makeWeb3Provider();

interface BlueCreateWalletButtonProps {
  handleSuccess: (address: string) => void;
  handleError: (error: unknown) => void;
}

export function WalletButton({
  handleSuccess,
  handleError,
}: BlueCreateWalletButtonProps) {
  const [loading, setLoading] = useState(false);

  const createWallet = useCallback(async () => {
    try {
      setLoading(true); // Start loading when attempting to create a wallet
      const [address] = await (provider.request({
        method: 'eth_requestAccounts',
      }) as Promise<string[]>);
      handleSuccess(address); // Pass the address to the success handler
    } catch (error) {
      handleError(error); // Handle errors
    } finally {
      setLoading(false); // Stop loading once the operation is done
    }
  }, [handleSuccess, handleError]);

  return (
    <button style={buttonStyles} onClick={createWallet} disabled={loading}>
      <CoinbaseWalletLogo />
      {loading ? 'Connecting...' : 'Create Wallet'}
    </button>
  );
}
