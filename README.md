# SOCKET_ORCHESTRATOR

## Overview

SOCKET_ORCHESTRATOR is a covert communication system designed for secure messaging and coordination in environments with limited internet connectivity. This project consists of an orchestrator and child nodes that communicate through encrypted sockets and leverage Redis for message storage.

## Prerequisites

- Node.js installed
- Redis server installed and running

## Installation

1. Clone the repository:

    ```bash
    git clone https://github.com/KailasRJ/socket_orchestration_model.git
    ```

2. Navigate to the orchestrator directory:

    ```bash
    cd SOCKET_ORCHESTRATOR/orchestrator
    ```

3. Install orchestrator dependencies:

    ```bash
    npm install
    ```

4. Navigate to the child node directory:

    ```bash
    cd ../child_node
    ```

5. Install child node dependencies:

    ```bash
    npm install
    ```

## Usage

### Start Orchestrator

cd orchestrator
node orchestrator.js

cd child_node
node child.js


## Usage
Orchestrator
POST /generateUniqueKey: Generate a unique key for a child node.
GET /send-message?key=uniqueKey&message=encryptedMessage: Send a secure message to a child node.
GET /wipeMessages: Wipe out stored messages in the Redis database.
GET /buildTranscript: Build a transcript of messages from the Redis database.
GET /send-message-to-node?nodeId=nodeId&message=encryptedMessage: Send a message to a specific child node.
Child Node
GET /send-message?message=encryptedMessage: Send a secure message to the orchestrator.

## Security
Messages exchanged between the orchestrator and child nodes are encrypted using a secret key, ensuring confidentiality and data integrity.

