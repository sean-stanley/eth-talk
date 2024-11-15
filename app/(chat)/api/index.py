import json
import os
import sys
import time

from langchain_core.messages import HumanMessage
from langchain_openai import ChatOpenAI
from langgraph.checkpoint.memory import MemorySaver
from langgraph.prebuilt import create_react_agent

# Import CDP Agentkit Langchain Extension.
from cdp_langchain.agent_toolkits import CdpToolkit
from cdp_langchain.utils import CdpAgentkitWrapper
from cdp_langchain.tools import CdpTool
from pydantic import BaseModel, Field
from cdp import *

from http.server import BaseHTTPRequestHandler
from os.path import dirname, abspath, join

from flask import Flask
from flask import request, json
app = Flask("eth-talk")

# Configure a file to persist the agent's CDP MPC Wallet Data.
wallet_data_file = "wallet_data.txt"

dir = dirname(abspath(__file__))

def initialize_agent(model: String = "gpt-4o-mini"):
    """Initialize the agent with CDP Agentkit."""
   # System prompt
    print("Initializing CDP Agentkit Chatbot...")
    prompt = None
    with open(join(dir, "chat2", "system_prompt.txt")) as f:
        prompt = f.read()
   
    # Initialize LLM.
    llm = ChatOpenAI(model=model)

    wallet_data = None

    with open(join(dir, "chat2", wallet_data_file)) as f:
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
    tools = cdp_toolkit.get_tools()

    # Store buffered conversation history in memory.
    memory = MemorySaver()
    config = {"configurable": {"thread_id": "CDP Agentkit Chatbot Example!"}}

    # Create ReAct Agent using the LLM and CDP Agentkit tools.
    return create_react_agent(
        llm,
        tools=tools,
        checkpointer=memory,
        state_modifier=
        prompt,
    ), config
    
# Reply to conversation
def conversation_reply(agent_executor, config, user_input):
    """Reply to a conversation."""
    
    reply = ""
    # Run agent with the user's input in chat mode
    # TODO: 
    for chunk in agent_executor.stream(
        {"messages": [HumanMessage(content=user_input)]}, config):
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

@app.route("/api/python", methods = ['POST'])
def chat_reply():
    data = json.loads(request.data)
    print(data)
    agent_executor, config = initialize_agent()
    reply = conversation_reply(agent_executor, config, "Hello")
    return reply