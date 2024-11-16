'use client';

import { cn, color, pressable, text } from '@coinbase/onchainkit/theme';
import { Address, Hex, parseUnits } from 'viem';
import { useQuery } from '@tanstack/react-query';
import { spendPermissionManagerAddress } from '@/lib/abi/SpendPermissionManager';

import React, { useCallback, useEffect, useMemo, useState } from 'react';
import {
  useAccount,
  useChainId,
  useConnect,
  useConnectors,
  useSignTypedData,
} from 'wagmi';
import { CoinbaseWalletLogo } from './CoinbaseWalletLogo';

const GRADIENT_BORDER_WIDTH = 2;

const buttonStyles = {
  background: 'transparent',
  border: '1px solid transparent',
  boxSizing: 'border-box' as 'border-box',
};

const contentWrapperStyle: React.CSSProperties = {
  position: 'relative',
};

import { ReactNode } from 'react';

function Gradient({
  children,
  style,
  isAnimationDisabled = false,
}: {
  children: ReactNode;
  style: React.CSSProperties;
  isAnimationDisabled?: boolean;
}) {
  const [isAnimating, setIsAnimating] = useState(false);
  const gradientStyle = useMemo(() => {
    const rotate = isAnimating ? '720deg' : '0deg';
    return {
      transform: `rotate(${rotate})`,
      transition: isAnimating
        ? 'transform 2s cubic-bezier(0.27, 0, 0.24, 0.99)'
        : 'none',
      ...style,
    };
  }, [isAnimating, style]);

  const handleMouseEnter = useCallback(() => {
    if (isAnimationDisabled || isAnimating) return;
    setIsAnimating(true);
  }, [isAnimationDisabled, isAnimating, setIsAnimating]);

  useEffect(() => {
    if (!isAnimating) return;
    const animationTimeout = setTimeout(() => {
      setIsAnimating(false);
    }, 2000);
    return () => {
      clearTimeout(animationTimeout);
    };
  }, [isAnimating]);

  return (
    <div style={contentWrapperStyle} onMouseEnter={handleMouseEnter}>
      <div className="gradient-background" style={gradientStyle} />
      {children}
    </div>
  );
}

export function WalletButton({ height = 66, width = 200 }) {
  const [isDisabled, setIsDisabled] = useState(false);
  const [signature, setSignature] = useState<Hex>();
  const [transactions, setTransactions] = useState<Hex[]>([]);
  const [spendPermission, setSpendPermission] = useState<object>();

  const { signTypedDataAsync } = useSignTypedData();
  const account = useAccount();
  const chainId = useChainId();
  const { connectAsync } = useConnect();

  const { data, error, isLoading, refetch } = useQuery({
    queryKey: ['collectSubscription'],
    queryFn: handleCollectSubscription,
    refetchOnWindowFocus: false,
    enabled: !!signature,
  });

  const { connectors, connect } = useConnect();

  const minButtonHeight = 48;
  const minButtonWidth = 200;
  const buttonHeight = Math.max(minButtonHeight, height);
  const buttonWidth = Math.max(minButtonWidth, width);
  const gradientDiameter = Math.max(buttonHeight, buttonWidth);
  const styles: { [key: string]: React.CSSProperties } = useMemo(
    () => ({
      gradientContainer: {
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: 'black',
        borderRadius: buttonHeight / 2,
        height: buttonHeight,
        width: buttonWidth,
        boxSizing: 'border-box' as 'border-box',
        overflow: 'hidden',
      },
      gradient: {
        background:
          'conic-gradient(from 180deg, #45E1E5 0deg, #0052FF 86.4deg, #B82EA4 165.6deg, #FF9533 255.6deg, #7FD057 320.4deg, #45E1E5 360deg)',
        position: 'absolute',
        top: -buttonHeight - GRADIENT_BORDER_WIDTH,
        left: -GRADIENT_BORDER_WIDTH,
        width: gradientDiameter,
        height: gradientDiameter,
      },
      buttonBody: {
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        boxSizing: 'border-box',
        backgroundColor: '#000000',
        height: buttonHeight - GRADIENT_BORDER_WIDTH * 2,
        width: buttonWidth - GRADIENT_BORDER_WIDTH * 2,
        fontFamily: 'Arial, sans-serif',
        fontWeight: 'bold',
        fontSize: 18,
        borderRadius: buttonHeight / 2,
        position: 'relative',
        paddingRight: 10,
      },
    }),
    [buttonHeight, buttonWidth, gradientDiameter]
  );

  const createWallet = useCallback(() => {
    const coinbaseWalletConnector = connectors.find(
      (connector) => connector.id === 'coinbaseWalletSDK'
    );
    if (coinbaseWalletConnector) {
      connect({ connector: coinbaseWalletConnector });
    }
  }, [connectors, connect]);

  async function handleSubmit() {
    setIsDisabled(true);
    let accountAddress = account?.address;
    if (!accountAddress) {
      try {
        const requestAccounts = await connectAsync({
          connector: connectors[0],
        });
        accountAddress = requestAccounts.accounts[0];
      } catch {
        return;
      }
    }

    const spendPermission = {
      account: accountAddress, // User wallet address
      spender: process.env.NEXT_PUBLIC_SPENDER_ADDRESS! as Address, // Spender smart contract wallet address
      token: '0xEeeeeEeeeEeEeeEeEeEeeEEEeeeeEeeeeeeeEEeE' as Address, // ETH (https://eips.ethereum.org/EIPS/eip-7528)
      allowance: parseUnits('10', 18),
      period: 86400, // seconds in a day
      start: 0, // unix timestamp
      end: 281474976710655, // max uint48
      salt: BigInt(0),
      extraData: '0x' as Hex,
    };

    try {
      const signature = await signTypedDataAsync({
        domain: {
          name: 'Spend Permission Manager',
          version: '1',
          chainId: chainId,
          verifyingContract: spendPermissionManagerAddress,
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
        message: spendPermission,
      });
      setSpendPermission(spendPermission);
      setSignature(signature);
    } catch (e) {
      console.error(e);
    }
    setIsDisabled(false);
  }

  async function handleCollectSubscription() {
    setIsDisabled(true);
    let data;
    try {
      const replacer = (key: string, value: any) => {
        if (typeof value === 'bigint') {
          return value.toString();
        }
        return value;
      };
      const response = await fetch('/collect', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(
          {
            spendPermission,
            signature,
            dummyData: Math.ceil(Math.random() * 100),
          },
          replacer
        ),
      });
      if (!response.ok) {
        throw new Error('Network response was not ok');
      }
      data = await response.json();
    } catch (e) {
      console.error(e);
    }
    setIsDisabled(false);
    return data;
  }

  useEffect(() => {
    if (!data) return;
    setTransactions([data?.transactionHash, ...transactions]);
  }, [data]);

  return (
    <div>
      {!signature ? (
        <div className="flex w-[450px]">
          <button
            style={buttonStyles}
            onClick={handleSubmit}
            type="button"
            disabled={isDisabled}
            data-testid="ockTransactionButton_Button"
          >
            <div style={styles.gradientContainer}>
              <Gradient style={styles.gradient}>
                <div style={styles.buttonBody}>
                  <CoinbaseWalletLogo />
                  Subscribe
                </div>
              </Gradient>
            </div>
          </button>
        </div>
      ) : (
        <div className="space-y-8 w-[450px]">
          <div className="flex">
            <button
              style={buttonStyles}
              onClick={() => refetch()}
              type="button"
              disabled={isDisabled}
              data-testid="collectSubscriptionButton_Button"
            >
              <div style={styles.gradientContainer}>
                <Gradient style={styles.gradient}>
                  <div style={styles.buttonBody}>Collect Subscription</div>
                </Gradient>
              </div>
            </button>
          </div>
          <div className="h-80 space-y-4 relative">
            <div className="text-lg font-bold">Subscription Payments</div>
            <div className="flex flex-col">
              {transactions.map((transactionHash, i) => (
                <a
                  key={i}
                  className="hover:underline text-ellipsis truncate"
                  target="_blank"
                  href={`https://sepolia.basescan.org/tx/${transactionHash}`}
                >
                  View transaction {transactionHash}
                </a>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
