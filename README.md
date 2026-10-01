# 🔐 ZKredit — Privacy-Preserving Credit Assessment Prototype

<div align="center">

![ZKredit Banner](https://img.shields.io/badge/ZK--Powered-Credit%20Assessment-blue?style=for-the-badge)
[![Hedera](https://img.shields.io/badge/Hedera-Testnet-00D4AA?style=for-the-badge&logo=hedera)](https://hedera.com)
[![Noir](https://img.shields.io/badge/Noir-Experimental%20Circuits-000000?style=for-the-badge)](https://noir-lang.org)
[![License](https://img.shields.io/badge/License-MIT-green?style=for-the-badge)](./LICENSE)

**A hackathon prototype exploring privacy-preserving credit assessment**

</div>

> **Project status:** This is a hackathon prototype. The application demo and parts of the smart-contract integration are implemented, while end-to-end zero-knowledge proof generation and verification remain incomplete and are mocked in parts of the workflow.

## Overview

ZKredit explores how users might prove selected credit conditions without revealing their complete financial records. The project combines a Next.js frontend, a Node.js backend, Solidity contracts on Hedera Testnet, and experimental Noir circuits.

The main implementation was developed during a hackathon. The repository is intended to document the prototype architecture and current implementation status rather than present a complete production-ready credit system.

## Architecture

The prototype consists of four main components:

1. **Frontend (`packages/nextjs`)**
   - Next.js application for demonstrating the user flow.
   - Includes a Demo Mode that mocks backend responses for easier testing.

2. **Agent Backend (`agent-backend`)**
   - Node.js service for the prototype's agent and credit-assessment flows.
   - Includes integrations with Hedera Testnet and experimental proof-related workflows.

3. **ZK Circuits (`packages/foundry`)**
   - Experimental Noir circuits for expressing conditions related to income, credit history, and collateral.
   - End-to-end proof generation and verification are not yet fully integrated.

4. **Smart Contracts (`packages/foundry`)**
   - Solidity contracts and related integrations targeting Hedera Testnet.
   - Some contract interactions are implemented, while other application flows remain incomplete or mocked.

## Implementation Status

### Working / Demonstrated

- Next.js frontend and demo flow
- Node.js backend structure and API endpoints
- Solidity contracts and selected Hedera Testnet interactions
- Experimental Noir circuit structure
- Agent registry and reputation-related backend integrations

### Pending / Incomplete

- End-to-end Noir proof generation
- End-to-end proof verification in the application workflow
- Complete integration between the frontend, backend, circuits, and contracts
- Production-ready security, privacy, and credit-assessment logic

## Setup Guide

### Prerequisites

- Node.js 18+
- Yarn or npm
- Git

### Installation

1. **Clone the repository**

   ```bash
   git clone https://github.com/fromtaoyuanhsinchuuuu/ZKredit.git
   cd ZKredit
   ```

2. **Install dependencies**

   ```bash
   yarn install
   ```

3. **Configure environment variables**

   Copy `.env.example` to `.env` in `packages/nextjs` and `agent-backend` where applicable. Hedera Testnet credentials and any required API keys are needed for the corresponding integrations.

### Running the Project

#### Frontend Demo Mode

The frontend includes a Demo Mode that mocks backend responses.

```bash
cd packages/nextjs
yarn dev
```

Open [http://localhost:3000](http://localhost:3000) to view the application.

#### Local Backend and Frontend

Start the backend:

```bash
cd agent-backend
npm install
npm run dev
```

In a second terminal, start the frontend:

```bash
cd packages/nextjs
# Configure the frontend to use the local backend as needed.
yarn dev
```

## Repository Notes

- The prototype should not be treated as a production credit-scoring or financial application.
- Some proof-related and backend responses are currently mocked for demonstration purposes.
- The current implementation is intended to show the project direction, architecture, and integration experiments.

## License

This project is licensed under the MIT License. See the [LICENSE](LICENSE) file for details.
