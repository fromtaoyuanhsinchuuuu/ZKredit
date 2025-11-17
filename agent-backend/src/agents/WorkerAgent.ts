import { Client, PrivateKey } from '@hashgraph/sdk';
import * as crypto from 'crypto';
import { generateCreditHistoryNoirProof } from '../services/noirCreditHistory';
import {
  recordRemittanceEvent,
  summarizeRemittanceHistory,
  deriveZkAttributesFromRemittances,
} from '../services/eventLedger';

export class WorkerAgent {
  private agentId: bigint;
  private client: Client;
  private privateKey: PrivateKey;
  private defaultCorridor: string;
  
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
    receiverAccountId: string;
    amount: number;
    currency?: string;
    corridor?: string;
  }) {
    const corridor = params.corridor || this.defaultCorridor;
    const currency = params.currency || 'USD';
    console.log('\n\n💸 WorkerAgent initiating remittance');
    console.log(`   👷 Worker: Agent #${this.agentId.toString()}`);
    console.log(`   👪 Receiver Account: ${params.receiverAccountId}`);
    console.log(`   🌍 Corridor: ${corridor}`);
    console.log(`   💰 Amount: $${params.amount} ${currency}`);

    const fee = this.calculateRemittanceFee(params.amount);
    const netAmount = params.amount - fee;
    console.log(`   🧮 Fee: $${fee.toFixed(2)} (0.7% min $0.50)`);
    console.log(`   📤 Net amount to family: $${netAmount.toFixed(2)}`);

    const txHash = '0x' + crypto.randomBytes(32).toString('hex');
    await new Promise(resolve => setTimeout(resolve, 500));
    console.log('   ✅ Simulated HTS/x402 transfer complete');
    console.log(`   🔗 HashScan: ${txHash.slice(0, 20)}...`);

    const remittanceEvent = recordRemittanceEvent({
      workerAgentId: this.agentId.toString(),
      remittanceAgentId: this.agentId.toString(),
      receiverAgentId: params.receiverAccountId,
      corridor,
      amount: params.amount,
      fee,
      netAmount,
      currency,
      transactionHash: txHash,
      timestamp: Date.now(),
    });

    console.log('   📝 HCS RemittanceEvent logged');
    console.log('   🧾 Stored for future ZK attributes');

    return {
      success: true,
      transactionHash: txHash,
      fee,
      netAmount,
      corridor,
      currency,
      remittanceEvent,
      message: `Remittance of $${netAmount.toFixed(2)} sent to family account ${params.receiverAccountId}`,
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
    const noirArtifacts = await generateCreditHistoryNoirProof({
      actualTransactionCount,
      minimumTransactions,
      timeRangeMonths: 6,
      workerAgentId: this.agentId,
      transactionMerkleRoot: merkleRoot,
    });

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
