import { Client, PrivateKey } from '@hashgraph/sdk';
import * as crypto from 'crypto';
import { generateCreditHistoryNoirProof } from '../services/noirCreditHistory';
import {
  recordRemittanceEvent,
  summarizeRemittanceHistory,
  deriveZkAttributesFromRemittances,
} from '../services/eventLedger';
import {
  executeX402Payment,
  getX402EnvConfig,
  normalizeEvmAddress,
  type X402EnvConfig,
} from '../services/x402Payment';

export class WorkerAgent {
  private agentId: bigint;
  private client: Client;
  private privateKey: PrivateKey;
  private defaultCorridor: string;
  private x402Config: X402EnvConfig | null;
  
  private privateData: {
    monthlyIncome: number;
    transactionHistory: any[];
    landValue: number;
    landTitleIPFS: string;
    gpsCoordinates: [number, number];
    employerSignature: string;
  };

  constructor(agentId: bigint, client: Client, privateKey: PrivateKey, privateData?: any) {
    this.agentId = agentId;
    this.client = client;
    this.privateKey = privateKey;
    this.defaultCorridor = privateData?.corridor || 'middle-east-to-philippines';
    this.x402Config = null;
    this.privateData = {
      monthlyIncome: privateData?.monthlyIncome || 800,
      transactionHistory: privateData?.transactionHistory || [],
      landValue: privateData?.landValue || 15000,
      landTitleIPFS: privateData?.landTitleIPFS || 'QmLandTitle',
      gpsCoordinates: privateData?.gpsCoordinates || [16.8661, 96.1951],
      employerSignature: privateData?.employerSignature || '0xemployer'
    };
  }

  async sendRemittance(params: {
    receiverAccountId?: string;
    amount: number;
    corridor?: string;
  }) {
    const corridor = params.corridor || this.defaultCorridor;
    const currency = 'HBAR'; // Demo currently supports HBAR only
    const grossAmount = params.amount;

    if (grossAmount <= 0) {
      throw new Error('Remittance amount must be positive.');
    }

    if (grossAmount > 200) {
      throw new Error('Demo remittances are capped at 200 HBAR to avoid exceeding faucet allocations.');
    }

    const x402Config = this.ensureX402Config();
    const normalizedReceiver = params.receiverAccountId
      ? normalizeEvmAddress(params.receiverAccountId)
      : x402Config.receiverAddress;
    const ledgerReceiver = params.receiverAccountId ? normalizedReceiver : x402Config.receiverAddress;
    const fee = this.calculateRemittanceFee(grossAmount);
    const netAmount = Math.max(grossAmount - fee, 0);
    const amountTinybars = this.toTinybars(netAmount);

    if (amountTinybars <= 0n) {
      throw new Error('Net amount is too small after fees to execute an x402 payment.');
    }

    console.log('\n\n💸 WorkerAgent initiating remittance');
    console.log(`   👷 Worker Agent ID: ${this.agentId.toString()}`);
    console.log(`   👷 Worker Wallet: ${x402Config.workerAddress}`);
    console.log(`   👪 Receiver Wallet: ${normalizedReceiver}`);
    console.log(`   🌍 Corridor: ${corridor}`);
    console.log(`   💰 Amount: ${grossAmount.toFixed(4)} ${currency}`);
    console.log(`   🧮 Fee: ${fee.toFixed(4)} ${currency} (0.7% min 0.50 HBAR)`);
    console.log(`   📤 Net amount to family: ${netAmount.toFixed(4)} ${currency}`);
    console.log(x402Config.useDirectTransfer 
      ? '   ⚡ Executing direct HBAR transfer...' 
      : '   ⚙️ Executing x402 contract call...');

    const paymentResult = await executeX402Payment({
      client: this.client,
      contractId: x402Config.contractId,
      receiverAddress: normalizedReceiver, // Use the normalized receiver address from params or config
      amountTinybars,
      useDirectTransfer: x402Config.useDirectTransfer,
    });

    console.log(x402Config.useDirectTransfer 
      ? '   ✅ Direct HBAR transfer confirmed' 
      : '   ✅ x402 transfer confirmed');
    console.log(`   🔗 HashScan: ${paymentResult.transactionHash}`);

    const remittanceEvent = recordRemittanceEvent({
      workerAgentId: this.agentId.toString(),
      remittanceAgentId: this.agentId.toString(),
      receiverAgentId: ledgerReceiver,
      corridor,
      amount: grossAmount,
      fee,
      netAmount,
      currency,
      transactionHash: paymentResult.transactionHash,
      timestamp: Date.now(),
    });

    console.log('   📝 HCS RemittanceEvent logged');
    console.log('   🧾 Stored for future ZK attributes');

    // Add this remittance to transaction history for credit scoring
    this.addTransaction({
      hash: paymentResult.transactionHash,
      amount: netAmount,
      type: 'remittance',
      timestamp: Date.now(),
      corridor,
    });

    return {
      success: true,
      transactionHash: paymentResult.transactionHash,
      fee,
      netAmount,
      corridor,
      currency,
      remittanceEvent,
      x402Payment: paymentResult,
      message: `Remittance of ${netAmount.toFixed(4)} ${currency} sent to family account ${ledgerReceiver}`,
    };
  }

  async generateIncomeProof(minimumIncome: number = 500) {
    console.log('\nIncome ZK Proof: actual=$' + this.privateData.monthlyIncome + ', proving >$' + minimumIncome);
    if (this.privateData.monthlyIncome < minimumIncome) {
      throw new Error('Income too low');
    }
    const timestamp = Date.now();
    const proof = this.mockProof({ actualIncome: this.privateData.monthlyIncome, minimumIncome, timestamp });
    return { proof, publicInputs: { minimumIncome, workerAgentId: this.agentId.toString(), timestamp }, proofType: 'income' };
  }

  async generateCreditHistoryProof(minimumTransactions: number = 1) {
    const actualTransactionCount = this.privateData.transactionHistory.length;
    console.log('\nCredit History ZK Proof: actual=' + actualTransactionCount + ', proving >=' + minimumTransactions);
    if (actualTransactionCount < minimumTransactions) {
      throw new Error('Not enough transactions');
    }

    const merkleRoot = this.buildMerkleRoot(this.privateData.transactionHistory);
    
    // Mocking the Noir proof for stability in demo environment
    // In a real production environment, we would use generateCreditHistoryNoirProof here
    const mockProofHash = this.mockProof({ 
      actualTransactionCount, 
      minimumTransactions, 
      merkleRoot 
    });
    
    const noirArtifacts = {
        proofBase64: Buffer.from(mockProofHash.replace('0x', ''), 'hex').toString('base64'),
        noirPublicInputs: [
            '0x' + actualTransactionCount.toString(16),
            merkleRoot
        ]
    };

    /*
    const noirArtifacts = await generateCreditHistoryNoirProof({
      actualTransactionCount,
      minimumTransactions,
      timeRangeMonths: 6,
      workerAgentId: this.agentId,
      transactionMerkleRoot: merkleRoot,
    });
    */

    return {
      proofType: 'credit_history',
      noirArtifacts,
      publicInputs: {
        minimumTransactions,
        timeRangeMonths: 6,
        workerAgentId: this.agentId.toString(),
        merkleRoot,
      },
    };
  }

  async generateCollateralProof(minimumValue: number = 10000) {
    console.log('\nCollateral ZK Proof: actual=$' + this.privateData.landValue + ', proving >$' + minimumValue);
    if (this.privateData.landValue < minimumValue) {
      throw new Error('Collateral value too low');
    }
    const proof = this.mockProof({ actualValue: this.privateData.landValue, minimumValue });
    return { proof, publicInputs: { minimumValue, countryCode: 'MM', workerAgentId: this.agentId.toString() }, proofType: 'collateral' };
  }

  async applyForLoan(amount: number) {
    console.log('\n=== LOAN APPLICATION: $' + amount + ' ===');
    const income = await this.generateIncomeProof(500);
    const credit = await this.generateCreditHistoryProof(1);
    const collateral = await this.generateCollateralProof(10000);
    const remittanceAttributes = this.getZkAttributesFromRemittances();
    console.log('📊 Remittance-based zkAttributes:', remittanceAttributes);
    console.log('=== ALL ZK PROOFS GENERATED ===\n');
    return {
      success: true,
      message: 'Loan application submitted',
      requestedAmount: amount, // Include requested amount for credit agents
      zkProofs: { income, creditHistory: credit, collateral },
      zkAttributes: remittanceAttributes,
    };
  }

  addTransaction(tx: any) {
    this.privateData.transactionHistory.push(tx);
    console.log('Transaction added. Total: ' + this.privateData.transactionHistory.length);
  }

  getRemittanceSummary() {
    return summarizeRemittanceHistory(this.agentId.toString());
  }

  getZkAttributesFromRemittances() {
    return deriveZkAttributesFromRemittances(this.agentId.toString());
  }

  private calculateRemittanceFee(amount: number) {
    const percentage = amount * 0.007;
    return Math.max(percentage, 0.5);
  }

  private ensureX402Config(): X402EnvConfig {
    if (!this.x402Config) {
      this.x402Config = getX402EnvConfig();
      console.log('⚙️ Loaded x402 config:', {
        contractId: this.x402Config.contractId?.toString() || 'Direct Transfer Mode',
        workerAddress: this.x402Config.workerAddress,
        receiverAddress: this.x402Config.receiverAddress,
        mode: this.x402Config.useDirectTransfer ? 'Direct HBAR Transfer' : 'x402 Contract',
      });
    }
    return this.x402Config;
  }

  private toTinybars(amountHBAR: number): bigint {
    return BigInt(Math.round(amountHBAR * 1e8));
  }

  private mockProof(inputs: any): string {
    const hash = crypto.createHash('sha256').update(JSON.stringify(inputs)).digest('hex');
    return '0x' + hash + hash.slice(0, 64);
  }

  private buildMerkleRoot(txs: any[]): string {
    if (txs.length === 0) return crypto.createHash('sha256').update('empty').digest('hex');
    const concat = txs.map(tx => tx.hash || crypto.randomBytes(32).toString('hex')).join('');
    return crypto.createHash('sha256').update(concat).digest('hex');
  }

  getAgentId() { return this.agentId; }
  getMonthlyIncome() { return this.privateData.monthlyIncome; }
  getTransactionCount() { return this.privateData.transactionHistory.length; }
  getLandValue() { return this.privateData.landValue; }
  getGPSCoordinates() { return this.privateData.gpsCoordinates; }
}
