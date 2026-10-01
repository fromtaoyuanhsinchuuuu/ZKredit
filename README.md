# 🔐 ZKredit — Privacy-Preserving Credit Assessment Prototype

<div align="center">

[![Hedera](https://img.shields.io/badge/Hedera-Testnet-00D4AA?style=for-the-badge&logo=hedera)](https://hedera.com)
[![Noir](https://img.shields.io/badge/Noir-Experimental%20Circuits-000000?style=for-the-badge)](https://noir-lang.org)
[![License](https://img.shields.io/badge/License-MIT-green?style=for-the-badge)](./LICENSE)

**A hackathon prototype for privacy-preserving credit assessment.**

</div>

ZKredit explores how users can prove selected credit conditions without revealing their complete financial data. The project combines:

- **Next.js** frontend with Demo Mode
- **Node.js** backend
- **Solidity smart contracts** on Hedera Testnet
- Experimental **Noir** circuits for zero-knowledge proofs

> **Status:** This is a prototype. The frontend demo, backend structure, and parts of the Hedera integration are implemented. End-to-end ZK proof generation and verification are not yet complete, so parts of the workflow are mocked.

## Run locally

### Requirements

- Node.js 18+
- Yarn or npm
- Git

### Install

```bash
git clone https://github.com/fromtaoyuanhsinchuuuu/ZKredit.git
cd ZKredit
yarn install
```

Configure the required environment variables in `packages/nextjs` and `agent-backend` as needed.

### Frontend Demo

```bash
cd packages/nextjs
yarn dev
```

Open [http://localhost:3000](http://localhost:3000).

### Backend

```bash
cd agent-backend
npm install
npm run dev
```

## Current limitations

- End-to-end Noir proof generation and verification are incomplete.
- Some frontend and backend responses are mocked for demonstration.
- The project is not a production-ready credit-scoring or financial application.

## License

MIT License. See [LICENSE](LICENSE) for details.
