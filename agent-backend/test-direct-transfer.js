/**
 * Test Direct HBAR Transfer
 */
const { Client, PrivateKey, AccountId, TransferTransaction, Hbar } = require('@hashgraph/sdk');
require('dotenv').config({ path: './.env' });

async function testDirectTransfer() {
  console.log('🧪 Testing Direct HBAR Transfer\n');
  
  const accountIdStr = process.env.HEDERA_ACCOUNT_ID;
  const privateKeyStr = process.env.HEDERA_PRIVATE_KEY;
  const receiverEnv = process.env.RECEIVER_EVM_ADDRESS;
  
  console.log('📋 Configuration:');
  console.log('   Sender Account ID:', accountIdStr);
  console.log('   Receiver Address:', receiverEnv);
  console.log();
  
  try {
    // Setup client
    const accountId = AccountId.fromString(accountIdStr);
    const privateKey = PrivateKey.fromString(privateKeyStr);
    const client = Client.forTestnet();
    client.setOperator(accountId, privateKey);
    console.log('✅ Client configured');
    
    // Parse receiver address (convert EVM to AccountId)
    let receiverAccountId;
    if (receiverEnv.startsWith('0x')) {
      const hexAddr = receiverEnv.slice(2).padStart(40, '0');
      receiverAccountId = AccountId.fromSolidityAddress(hexAddr);
    } else {
      receiverAccountId = AccountId.fromString(receiverEnv);
    }
    console.log('✅ Receiver parsed:', receiverAccountId.toString());
    
    // Test transfer with 1 HBAR
    const amountTinybars = 100_000_000; // 1 HBAR
    
    console.log();
    console.log('🔍 Sending direct HBAR transfer...');
    console.log('   Amount:', amountTinybars, 'tinybars (1 HBAR)');
    console.log();
    
    const transaction = new TransferTransaction()
      .addHbarTransfer(accountId, Hbar.fromTinybars(-amountTinybars))
      .addHbarTransfer(receiverAccountId, Hbar.fromTinybars(amountTinybars));
    
    console.log('📝 Transaction built, executing...');
    const txResponse = await transaction.execute(client);
    console.log('✅ Transaction submitted:', txResponse.transactionId.toString());
    
    console.log('⏳ Waiting for receipt...');
    const receipt = await txResponse.getReceipt(client);
    console.log('✅ Receipt received, status:', receipt.status.toString());
    
    const record = await txResponse.getRecord(client);
    const hashBytes = Buffer.from(record.transactionHash);
    const transactionHash = `0x${hashBytes.toString('hex')}`;
    console.log('📋 Transaction Hash:', transactionHash);
    
    console.log();
    console.log('🎉 Direct transfer succeeded!');
    console.log('✅ You can use direct transfers instead of the x402 contract.');
    
  } catch (error) {
    console.error('❌ Error:', error.message);
    console.error('   Status:', error.status?.toString());
    if (error.stack) {
      console.error('Stack:', error.stack);
    }
  } finally {
    process.exit(0);
  }
}

testDirectTransfer().catch(error => {
  console.error('Fatal error:', error);
  process.exit(1);
});
