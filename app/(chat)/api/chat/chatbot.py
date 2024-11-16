import json

from langchain_core.messages import HumanMessage, AIMessage
from langchain_openai import ChatOpenAI
from langgraph.checkpoint.memory import MemorySaver
from langgraph.prebuilt import create_react_agent

# Import CDP Agentkit Langchain Extension.
from cdp_langchain.agent_toolkits import CdpToolkit
from cdp_langchain.utils import CdpAgentkitWrapper
from cdp_langchain.tools import CdpTool
from cdp import *

# Import web3

from os.path import dirname, abspath

# local imports
from tools import send_to_ens_tool, coin_quote_tool

from flask import Flask
from flask import request, json

app = Flask(__name__)

# Configure a file to persist the agent's CDP MPC Wallet Data.
wallet_data_file = "wallet_data.txt"

dir = dirname(abspath(__file__))

# Rest of the code goes here...


def initialize_agent(model: str = "gpt-4o-mini"):
    """Initialize the agent with CDP Agentkit."""
    # System prompt
    print("Initializing CDP Agentkit Chatbot...")
    prompt = None
    with open("system_prompt.txt") as f:
        prompt = f.read()

    # Initialize LLM.
    llm = ChatOpenAI(model=model)

    wallet_data = None

    # TODO: replace with access to the user's wallet
    with open(wallet_data_file) as f:
        wallet_data = f.read()

    # Configure CDP Agentkit Langchain Extension.
    values = {}
    if wallet_data is not None:
        # If there is a persisted agentic wallet, load it and pass to the CDP Agentkit Wrapper.
        values = {"cdp_wallet_data": wallet_data}

    agentkit = CdpAgentkitWrapper(**values)

    # persist the agent's CDP MPC Wallet Data.
    wallet_data = agentkit.export_wallet()
    with open(wallet_data_file, "w") as f:
        f.write(wallet_data)

    # Initialize CDP Agentkit Toolkit and get tools.
    cdp_toolkit = CdpToolkit.from_cdp_agentkit_wrapper(agentkit)

    # get_wallet_details - Get details about the MPC Wallet
    # get_balance - Get balance for specific assets
    # request_faucet_funds - Request test tokens from faucet
    # transfer - Transfer assets between addresses
    # trade - Trade assets (Mainnet only)
    # deploy_token - Deploy ERC-20 token contracts
    # mint_nft - Mint NFTs from existing contracts
    # deploy_nft - Deploy new NFT contracts
    # register_basename - Register a basename for the wallet
    # wow_create_token - Deploy a token using Zora’s Wow Launcher (Bonding Curve)
    cdp_tools = cdp_toolkit.get_tools()

    send_to_ens = CdpTool(
        name="send_to_ens_tool",
        description=
        "Send funds to an address by ENS (.eth) name instead of full address.",
        cdp_agentkit_wrapper=agentkit,
        args_schema=EnsTransferInput,
        func=send_to_ens_tool,
    )

    tools = cdp_tools + [coin_quote_tool, send_to_ens]

    # Store buffered conversation history in memory.
    memory = MemorySaver()
    config = {"configurable": {"thread_id": "CDP Agentkit Chatbot Example!"}}

    # Create ReAct Agent using the LLM and CDP Agentkit tools.
    return create_react_agent(
        llm,
        tools=tools,
        checkpointer=memory,
        state_modifier=prompt,
    ), config


# Reply to conversation
def conversation_reply(agent_executor, config, messages):
    """Reply to a conversation."""

    reply = ""
    # Run agent with the user's input in chat mode
    # TODO:
    for chunk in agent_executor.stream({"messages": messages}, config):
        if "agent" in chunk:
            agent_reply = chunk["agent"]["messages"][0].content
            print(agent_reply)
            reply += agent_reply
        elif "tools" in chunk:
            tools_reply = chunk["tools"]["messages"][0].content
            print(tools_reply)
            reply += tools_reply
        print("-------------------")
    return reply


# Mode Selection


@app.route("/api/chat", methods=['POST'])
def chat_reply():
    data = json.loads(request.data)
    print(data)
    agent_executor, config = initialize_agent()
    messages = data["messages"]
    langchain_messages = []
    for message in messages:
        if message["role"] == "user":
            langchain_messages.append(HumanMessage(content=message["content"]))
        elif message["role"] == "assistant":
            langchain_messages.append(AIMessage(content=message["content"]))
    reply = conversation_reply(agent_executor, config, langchain_messages)
    response = {"message": reply}
    return json.dumps(response)


@app.route("/api/spend-control", methods=['POST'])
def spend_control():
    '''
    Example spend control struct:
    [
      { internalType: 'address', name: 'account', type: 'address' },
      { internalType: 'address', name: 'spender', type: 'address' },
      { internalType: 'address', name: 'token', type: 'address' },
      { internalType: 'uint160', name: 'allowance', type: 'uint160' },
      { internalType: 'uint48', name: 'period', type: 'uint48' },
      { internalType: 'uint48', name: 'start', type: 'uint48' },
      { internalType: 'uint48', name: 'end', type: 'uint48' },
      { internalType: 'uint256', name: 'salt', type: 'uint256' },
      { internalType: 'bytes', name: 'extraData', type: 'bytes' },
    ]
    '''
    data = json.loads(request.data)
    print(data)
    # agent_executor, config = initialize_agent()
    Cdp.configure(os.getenv("CDP_API_KEY_NAME"), os.getenv("CDP_API_KEY_PRIVATE_KEY"))

    fetched_wallet = Wallet.fetch(wallet.id)
    fetched_wallet.load_seed(wallet_data_file)

    response = {"message": "spend control engaged! Lets go!"}
    return json.dumps(response)


if __name__ == '__main__':
    print("running agentkit microservice")
    app.run(host='0.0.0.0', port=5000)
