# 🔐 ZKredit - Zero-Knowledge Credit System

<div align="center">

![ZKredit Banner](https://img.shields.io/badge/ZK--Powered-Credit%20System-blue?style=for-the-badge)
[![Hedera](https://img.shields.io/badge/Hedera-Testnet-00D4AA?style=for-the-badge&logo=hedera)](https://hedera.com)
[![Noir](https://img.shields.io/badge/Noir-ZK%20Circuits-000000?style=for-the-badge)](https://noir-lang.org)
[![License](https://img.shields.io/badge/License-MIT-green?style=for-the-badge)](./LICENSE)

**Prove Your Creditworthiness Without Revealing Private Data**

</div>

## 💡 Concept

**ZKredit** is a privacy-preserving credit assessment system designed for cross-border workers. It allows users to prove their financial standing (income, transaction history, collateral) to lenders without revealing sensitive private data.

By leveraging **Zero-Knowledge Proofs (Noir)** and **Hedera Blockchain**, ZKredit enables:
- **Privacy**: Verify "Income > 00" without revealing the exact salary.
- **Trust**: Immutable credit scores and reputation on-chain.
- **Fairness**: AI-powered credit assessment based on verified proofs, not bias.

## ��️ Project Architecture

The system consists of four main components:

1.  **Frontend (`packages/nextjs`)**:
    - A Next.js application for users to manage their profiles, generate ZK proofs, and apply for loans.
    - Features a "Demo Mode" for easy testing without a local backend.

2.  **Agent Backend (`agent-backend`)**:
    - A Node.js service simulating the multi-agent ecosystem:
        - **Worker Agent**: Generates proofs.
        - **Credit Agent**: Verifies proofs and uses AI (Groq) for credit decisions.
        - **Remittance Agent**: Handles payment flows.
    - Interacts with Hedera Testnet and ZK circuits.

3.  **ZK Circuits (`packages/foundry`)**:
    - Written in **Noir**.
    - Defines the logic for proving income, credit history, and collateral ownership without leaking data.

4.  **Smart Contracts (`packages/foundry`)**:
    - Solidity contracts deployed on Hedera Testnet.
    - **ERC-8004**: For reputation and identity management.
    - **Registry**: Stores verified credit scores and agent identities.

## �� Setup Guide

### Prerequisites
- Node.js (v18+)
- Yarn or NPM
- Git

### Installation

1.  **Clone the repository**
    ```bash
    git clone https://github.com/fromtaoyuanhsinchuuuu/ZKredit.git
    cd ZKredit
    ```

2.  **Install Dependencies**
    ```bash
    yarn install
    ```

3.  **Environment Setup**
    - Copy `.env.example` to `.env` in `packages/nextjs` and `agent-backend`.
    - Fill in your Hedera Testnet credentials and API keys (Groq, etc.).

### Running the Project

**1. Frontend (Demo Mode)**
The frontend has a built-in Demo Mode that mocks backend responses, perfect for quick testing.
```bash
cd packages/nextjs
yarn dev
```
Open [http://localhost:3000](http://localhost:3000) to view the app.

**2. Full Stack (Local Backend)**
To run with the actual agent backend and blockchain interaction:

*Terminal 1: Backend*
```bash
cd agent-backend
npm install
npm run dev
```

*Terminal 2: Frontend*
```bash
cd packages/nextjs
# Ensure IS_DEMO_MODE is false in page.tsx or use localhost
yarn dev
```

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.
