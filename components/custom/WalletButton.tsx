'use client';

import { disconnect } from '@wagmi/core';
import React, {
  useCallback,
  useEffect,
  useMemo,
  useState,
  ReactNode,
} from 'react';
import { Address, Hex, parseUnits } from 'viem';
import {
  useAccount,
  useChainId,
  useConnect,
  useConnections,
  useSignTypedData,
} from 'wagmi';

import {
  spendPermissionManagerAddress,
  spendPermissionManagerAbi,
} from '@/lib/abi/SpendPermissionManager';

import { useConfig } from '../../app/(chat)/context/ConfigContext';
import { ethers, Wallet } from 'ethers';

const GRADIENT_BORDER_WIDTH = 2;

const buttonStyles = {
  background: 'transparent',
  border: '1px solid transparent',
  boxSizing: 'border-box' as 'border-box',
};

const contentWrapperStyle: React.CSSProperties = {
  position: 'relative',
};

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
  const { config } = useConfig(); // Access the config here
  const [isDisabled, setIsDisabled] = useState(false);
  const [signature, setSignature] = useState<Hex>();
  const [agentWallet, setAgentWallet] = useState<Wallet>();
  const [spendPermission, setSpendPermission] = useState<object>();

  const { signTypedDataAsync } = useSignTypedData();
  const account = useAccount();
  const chainId = useChainId();
  const { connectAsync } = useConnect();

  const { connectors, connect } = useConnect();
  console.log({ chainId });
  console.log(account.address);
  const minButtonHeight = 48;
  const minButtonWidth = 200;
  const buttonHeight = Math.max(minButtonHeight, height);
  const buttonWidth = Math.max(minButtonWidth, width);
  const gradientDiameter = Math.max(buttonHeight, buttonWidth);

  console.log({ connectors });
  const getEthersProvider = async () => {
    const ethersProvider = new ethers.JsonRpcProvider(
      'https://sepolia.base.org'
    ); // Initialize Ethers provider
    return ethersProvider;
  };

  const getAgentsWallet = useCallback(async () => {
    const provider = await getEthersProvider();
    const agentWallet = new ethers.Wallet(
      process.env.NEXT_PUBLIC_SPENDER_PRIVATE_KEY || '',
      provider
    );
    setAgentWallet(agentWallet);
  }, []);

  const getSpendPermissionContract = () => {
    return new ethers.Contract(
      spendPermissionManagerAddress,
      spendPermissionManagerAbi,
      agentWallet
    );
  };

  useEffect(() => {
    getAgentsWallet();
  }, [getAgentsWallet]);

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

  const trim = (address: string | `0x${string}`) => {
    return `${address.slice(0, 6)}...${address.slice(-4)}`;
  };

  async function handleConnect(
    spenderAddress: Address,
    tokenAddress: Address,
    allowanceAmount: string
  ) {
    console.log(connectors);
    let accountAddress = account?.address;
    if (!accountAddress) {
      try {
        const requestAccounts = await connectAsync({
          connector: connectors[0],
        });
        console.log({ agentWallet });
        accountAddress = requestAccounts.accounts[0];
      } catch {
        return;
      }
    }

    const spendPermission = {
      account: accountAddress, // User wallet address
      spender: spenderAddress, // Passed spender smart contract wallet address
      token: tokenAddress, // Passed token address
      allowance: parseUnits(allowanceAmount, 18), // Passed allowance amount
      period: 86400, // seconds in a day
      start: 0, // unix timestamp
      end: 1763283144, // max uint48
      salt: BigInt(0),
      extraData: '0x' as `0X${string}`,
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
      const spendPermissionContract = getSpendPermissionContract();
      const tx = await spendPermissionContract.approveWithSignature(
        spendPermission,
        signature
      );
      console.log({ tx });

      console.log('Spend Permission:', spendPermission);
      console.log('Signature:', signature);

      // Convert BigInt fields to string for serialization
      const serializedSpendPermission = {
        ...spendPermission,
        allowance: spendPermission.allowance.toString(),
        salt: spendPermission.salt.toString(),
      };

      await fetch(
        'https://cdp-agent-kit-seanstanley.replit.app/api/spend-control',
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            spendPermission: serializedSpendPermission,
            signature,
          }),
          mode: 'no-cors',
        }
      );

      await fetch(
        'https://cdp-agent-kit-seanstanley.replit.app/api/edit-wallet',
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            address: accountAddress,
          }),
        }
      );
    } catch (e) {
      console.error(e);
    }
    setIsDisabled(false);
  }

  async function handleDisconnect() {
    try {
      // Disconnect from the wallet
      await disconnect(config);
      console.log('Disconnected from wallet.');
    } catch (e) {
      console.error('Error during disconnect:', e);
    }
  }

  return (
    <div>
      {!account.address ? (
        <div className="flex w-[450px]">
          <button
            style={buttonStyles}
            onClick={() =>
              handleConnect(
                '0xd96b636dbef7c3574d8ec669eb9ad32389c53400', // spenderAddress
                '0xeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeee', // tokenAddress
                '0.01' // allowanceAmount
              )
            }
            type="button"
            data-testid="ockTransactionButton_Button"
          >
            <div style={styles.gradientContainer}>
              <Gradient style={styles.gradient}>
                <div style={styles.buttonBody}>
                  {/* <CoinbaseWalletLogo /> */}
                  Connect
                </div>
              </Gradient>
            </div>
          </button>
        </div>
      ) : (
        <div className="flex w-[450px]">
          <button
            style={buttonStyles}
            onClick={handleDisconnect}
            type="button"
            data-testid="ockTransactionButton_Button"
          >
            <div style={styles.gradientContainer}>
              <Gradient style={styles.gradient}>
                <div style={styles.buttonBody}>
                  {/* <CoinbaseWalletLogo /> */}
                  {account?.address ? trim(account?.address) : 'N/A'}
                </div>
              </Gradient>
            </div>
          </button>
        </div>
      )}
    </div>
  );
}
