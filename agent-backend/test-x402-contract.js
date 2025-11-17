/**
 * Test X402 Contract Call
 */
const { Client, PrivateKey, AccountId, ContractId, ContractExecuteTransaction, ContractFunctionParameters, Hbar } = require('@hashgraph/sdk');
const Long = require('long');
require('dotenv').config({ path: './.env' });

async function testX402Contract() {
  console.log('🧪 Testing X402 Contract Call\n');
  
  const accountIdStr = process.env.HEDERA_ACCOUNT_ID;
  const privateKeyStr = process.env.HEDERA_PRIVATE_KEY;
  const contractIdStr = process.env.X402_PAYMENT_CONTRACT_ID;
  const receiverEnv = process.env.RECEIVER_EVM_ADDRESS;
  
  console.log('📋 Configuration:');
  console.log('   Account ID:', accountIdStr);
  console.log('   Contract ID:', contractIdStr);
  console.log('   Receiver Address:', receiverEnv);
  console.log();
  
  try {
    // Setup client
    const accountId = AccountId.fromString(accountIdStr);
    const privateKey = PrivateKey.fromString(privateKeyStr);
    const client = Client.forTestnet();
    client.setOperator(accountId, privateKey);
    console.log('✅ Client configured');
    
    // Parse contract ID
    const contractId = ContractId.fromString(contractIdStr);
    console.log('✅ Contract ID parsed:', contractId.toString());
    
    // Test contract call with 1 HBAR
    const amountTinybars = 100_000_000; // 1 HBAR = 100,000,000 tinybars
    const receiverAddress = receiverEnv.includes('.')
      ? `0x${AccountId.fromString(receiverEnv).toSolidityAddress()}`
      : receiverEnv;
    const uintAmount = Long.fromNumber(amountTinybars);
    
    console.log();
    console.log('🔍 Calling contract pay() function...');
    console.log('   Amount:', amountTinybars, 'tinybars (1 HBAR)');
  console.log('   Receiver:', receiverAddress);
    console.log();
    
    // Contract function: pay(address _to, uint256 _amount)
    const functionParams = new ContractFunctionParameters()
      .addAddress(receiverAddress)
      .addUint256(uintAmount);
    
    const transaction = new ContractExecuteTransaction()
      .setContractId(contractId)
      .setGas(600_000)
      .setFunction('pay', functionParams)
      .setPayableAmount(Hbar.fromTinybars(amountTinybars));
    
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
    console.log('🎉 Contract call succeeded!');
    
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

testX402Contract().catch(error => {
  console.error('Fatal error:', error);
  process.exit(1);
});
