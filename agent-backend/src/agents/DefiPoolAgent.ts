import { Client, AccountId, PrivateKey, AccountBalanceQuery, TransferTransaction, Hbar } from '@hashgraph/sdk';

/**
 * DeFi Liquidity Pool Agent
 * Manages the liquidity pool for loan disbursements
 */
export class DefiPoolAgent {
  private poolId: AccountId;
  private privateKey: PrivateKey;
  private client: Client;
  private poolName: string;

  constructor(
    poolAccountId: string,
    privateKey: string,
    poolName: string = 'DeFi Liquidity Pool'
  ) {
    this.poolId = AccountId.fromString(poolAccountId);
    this.privateKey = PrivateKey.fromStringECDSA(privateKey);
    this.poolName = poolName;
    
    // Create dedicated client for pool
    this.client = Client.forTestnet();
    this.client.setOperator(this.poolId, this.privateKey);
  }

  /**
   * Get pool account ID
   */
  getAccountId(): string {
    return this.poolId.toString();
  }

  /**
   * Get pool balance
   */
  async getBalance(): Promise<{ hbars: string; tinybars: string }> {
    try {
      const balance = await new AccountBalanceQuery()
        .setAccountId(this.poolId)
        .execute(this.client);

      return {
        hbars: balance.hbars.toString(),
        tinybars: balance.hbars.toTinybars().toString(),
      };
    } catch (error: any) {
      console.error(`❌ Failed to fetch ${this.poolName} balance:`, error.message);
      throw error;
    }
  }

  /**
   * Disburse loan from pool to recipient
   */
  async disburseLoan(
    recipientAccountId: string,
    amount: number,
    currency: string = 'HBAR'
  ): Promise<{
    success: boolean;
    transactionId: string;
    amount: number;
    currency: string;
    poolAccount: string;
    recipient: string;
  }> {
    try {
      const recipientId = AccountId.fromString(recipientAccountId);

      console.log(`💸 ${this.poolName} disbursing ${amount} ${currency} to ${recipientId.toString()}...`);

      const transferTx = await new TransferTransaction()
        .addHbarTransfer(this.poolId, new Hbar(-amount))
        .addHbarTransfer(recipientId, new Hbar(amount))
        .execute(this.client);

      const receipt = await transferTx.getReceipt(this.client);

      console.log(`   ✅ Disbursement successful. Transaction ID: ${transferTx.transactionId.toString()}`);

      return {
        success: true,
        transactionId: transferTx.transactionId.toString(),
        amount,
        currency,
        poolAccount: this.poolId.toString(),
        recipient: recipientId.toString(),
      };
    } catch (error: any) {
      console.error(`❌ ${this.poolName} disbursement failed:`, error.message);
      throw error;
    }
  }

  /**
   * Close the client connection
   */
  close(): void {
    this.client.close();
  }

  /**
   * Get pool info
   */
  async getInfo(): Promise<{
    name: string;
    accountId: string;
    evmAddress: string;
    balance: { hbars: string; tinybars: string };
  }> {
    const balance = await this.getBalance();
    
    return {
      name: this.poolName,
      accountId: this.poolId.toString(),
      evmAddress: `0x${this.poolId.toSolidityAddress()}`,
      balance,
    };
  }
}
