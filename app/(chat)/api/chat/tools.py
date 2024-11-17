import json
import os
import requests

from langchain_core.tools import tool

# Import CDP Agentkit Langchain Extension.
from pydantic import BaseModel, Field
from cdp import Wallet
from cdp import *

# Import web3
from ens.auto import ns



class EnsTransferInput(BaseModel):
    ens_name: str = Field(..., description="ENS name to transfer to.")
    amount: float = Field(..., description="Amount to transfer.")


@tool("send-to-ens-tool", args_schema=EnsTransferInput, return_direct=True)
def send_to_ens_tool(wallet: Wallet, ens_name: str, amount: float) -> str:
    """
  Transfer eth to a specific ENS address.

  Args:
      ens_name (str): The ENS recipient.
      amount (float): The amount to transfer.

  Returns:
      str: A message indicating the transfer was successful.
  """
    # Your code to transfer the funds to an ENS name goes here.
    # For example, you can use the CDP SDK to transfer the funds to another address.
    # step 1. get address for ens from registry
    # step 2. transfer funds to address
    print(f"the ens_name to find: {ens_name}")
    address = ns.address(ens_name)
    if address is None:
        network = wallet.network_id
        return f"ENS name '{ens_name}' not found in this registry. Your network is {network}. Use the correct network for each type of ENS."
    wallet.transfer(destination=address, asset_id="ETH", amount=str(amount))
    # Here's a simple example that prints a message indicating the transfer was successful:
    print(f"Transferring {amount} ETH to ENS name {ens_name}")
    return f"Successfully transferred {amount} ETH to ENS name {ens_name}."


class CryptoQuoteInput(BaseModel):
    symbol1: str = Field(description="first asset type. ie BTC, ETH, etc")
    symbol2: str = Field(
        description="second asset type. ie USD, BTC, EUR, etc.")


@tool("coin-quote-tool", args_schema=CryptoQuoteInput, return_direct=True)
def coin_quote_tool(symbol1: str, symbol2: str) -> str:
    """Find how much a currency or token is worth relative to another."""
    url = 'https://pro-api.coinmarketcap.com/v2/cryptocurrency/quotes/latest'
    parameters = {
        'symbol':
        ",".join([symbol1, symbol2]),
        'aux':
        'num_market_pairs,cmc_rank,date_added,tags,platform,max_supply,circulating_supply,total_supply,market_cap_by_total_supply,volume_24h_reported,volume_7d,volume_7d_reported,volume_30d,volume_30d_reported,is_active,is_fiat',
    }
    print(parameters)
    headers = {
        "Accepts": "application/json",
        "X-CMC_PRO_API_KEY": os.getenv("COIN_MARKETCAP_API_KEY")
    }
    response = requests.get(url, headers=headers, params=parameters)
    body = json.dumps(response.json(), indent=4)
    print(body)
    return body


class GetTransactionHistoryInput(BaseModel):
    asset: str = Field(description="Asset to get transaction history for.")

@tool("get-transaction-history-tool", args_schema=GetTransactionHistoryInput, return_direct=True)
def get_transaction_history_tool(wallet: Wallet, asset: str) -> str:
    """
    Get transaction history for a token in your wallet.

    Args:
        wallet (Wallet): The wallet object.
        asset (str): The asset to get transaction history for.
    """
    # Your code to get transaction history for a token goes here.
    # later we will use the token
    address = wallet.default_address
    transactions = address.transfers()
    print(transactions)
    return f"Here is a list of all transactions for the address {address}: {transactions}."