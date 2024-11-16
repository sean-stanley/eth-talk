import { createPublicClient, createWalletClient, Hex, http } from 'viem';
import { privateKeyToAccount } from 'viem/accounts';
import { baseSepolia } from 'viem/chains';

export async function getPublicClient() {
  const client = createPublicClient({
    chain: baseSepolia,
    transport: http(),
  });
  return client;
}

export async function getSpenderWalletClient() {
  const spenderAccount = privateKeyToAccount(
    process.env.SPENDER_PRIVATE_KEY! as Hex
  );

  const spenderWallet = await createWalletClient({
    account: spenderAccount,
    chain: baseSepolia,
    transport: http(),
  });
  return spenderWallet;
}