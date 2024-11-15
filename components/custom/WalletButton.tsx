'use client';

import { useEffect, useState, useCallback } from 'react';
import { CoinbaseWalletSDK } from '@coinbase/wallet-sdk'; // Import inside useEffect to ensure it's only used client-side
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

export function WalletButton({
  handleSuccess,
  handleError,
}: {
  handleSuccess: (address: string) => void;
  handleError: (error: unknown) => void;
}) {
  const [loading, setLoading] = useState(false);
  const [coinbaseSDK, setCoinbaseSDK] = useState<CoinbaseWalletSDK | null>(
    null
  );
  const [isConnected, setIsConnected] = useState(false); // New state for tracking the connection

  useEffect(() => {
    if (typeof window !== 'undefined') {
      const sdk = new CoinbaseWalletSDK({
        appName: 'My Dapp',
        appLogoUrl: 'https://example.com/logo.png',
        appChainIds: [84532], // Modify the chain ID as needed
      });
      setCoinbaseSDK(sdk); // Set the SDK only in the client
    }
  }, []);

  const createWallet = useCallback(async () => {
    if (!coinbaseSDK) return; // Wait for SDK to be initialized

    try {
      setLoading(true); // Start loading when attempting to create a wallet
      const provider = coinbaseSDK.makeWeb3Provider();
      const accounts = (await provider.request({
        method: 'eth_requestAccounts',
      })) as string[];
      const [address] = accounts;
      handleSuccess(address); // Pass the address to the success handler
      setIsConnected(true); // Set the connection state to true once the wallet is connected
    } catch (error) {
      handleError(error); // Handle errors
    } finally {
      setLoading(false); // Stop loading once the operation is done
    }
  }, [coinbaseSDK, handleSuccess, handleError]);

  return (
    <button
      style={buttonStyles}
      onClick={createWallet}
      disabled={loading || isConnected} // Disable button if already connected
    >
      <CoinbaseWalletLogo />
      {loading
        ? 'Connecting...'
        : isConnected
          ? 'Connected'
          : 'Create Wallet'}{' '}
      {/* Button text */}
    </button>
  );
}
