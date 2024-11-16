'use client';

import { useEffect, useState, useCallback } from 'react';
import { createCoinbaseWalletSDK } from '@coinbase/wallet-sdk'; // Import inside useEffect to ensure it's only used client-side
import { CoinbaseWalletLogo } from './CoinbaseWalletLogo';
import { useSignTypedData } from 'wagmi'; // Assuming wagmi for signing typed data
import { parseUnits } from 'viem'; // For unit conversion

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
  const [coinbaseSDK, setCoinbaseSDK] = useState<ReturnType<
    typeof createCoinbaseWalletSDK
  > | null>(null);
  const [isConnected, setIsConnected] = useState(false); // New state for tracking the connection
  const [spendPermission, setSpendPermission] = useState<object | null>(null); // State for spend permission
  const { signTypedDataAsync } = useSignTypedData(); // For signing the typed data

  useEffect(() => {
    if (typeof window !== 'undefined') {
      const sdk = createCoinbaseWalletSDK({
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
      const provider = coinbaseSDK.getProvider();
      const accounts = (await provider.request({
        method: 'eth_requestAccounts',
      })) as string[];
      const [address] = accounts;
      handleSuccess(address); // Pass the address to the success handler
      setIsConnected(true); // Set the connection state to true once the wallet is connected

      // Generate spend permission data
      const spendPermissionData = {
        account: address as `0x${string}`, // User wallet address
        spender: process.env.NEXT_PUBLIC_SPENDER_ADDRESS! as `0x${string}`, // Spender smart contract address
        token: '0xEeeeeEeeeEeEeeEeEeEeeEEEeeeeEeeeeeeeEEeE' as `0x${string}`, // ETH
        allowance: parseUnits('10', 18), // 10 tokens allowance (adjust the amount as needed)
        period: 86400, // seconds in a day
        start: 0, // unix timestamp for start
        end: 281474976710655, // max uint48
        salt: BigInt(0), // Can be random
        extraData: '0x' as `0x${string}`, // Optional extra data
      };

      // Sign the spend permission data
      const signature = await signTypedDataAsync({
        domain: {
          name: 'Spend Permission Manager',
          version: '1',
          chainId: 84532, // Chain ID (modify as needed)
          verifyingContract: process.env
            .NEXT_PUBLIC_SPENDER_ADDRESS as `0x${string}`, // Spender contract address
        },
        types: {
          SpendPermission: [
            { name: 'account', type: 'address' },
            { name: 'spender', type: 'address' },
            { name: 'token', type: 'address' },
            { name: 'allowance', type: 'uint160' },
            { name: 'period', type: 'uint48' },
            { name: 'start', type: 'uint48' },
            { name: 'end', type: 'uint48' },
            { name: 'salt', type: 'uint256' },
            { name: 'extraData', type: 'bytes' },
          ],
        },
        primaryType: 'SpendPermission',
        message: spendPermissionData,
      });

      setSpendPermission({ ...spendPermissionData, signature }); // Store the spend permission and signature
    } catch (error) {
      handleError(error); // Handle errors
    } finally {
      setLoading(false); // Stop loading once the operation is done
    }
  }, [coinbaseSDK, handleSuccess, handleError, signTypedDataAsync]);

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
