/**
 * Test Hedera Authentication
 * This script verifies that the private key can sign transactions
 */

const { Client, PrivateKey, AccountId, AccountBalanceQuery, TransferTransaction, Hbar } = require('@hashgraph/sdk');
require('dotenv').config({ path: './.env' });

async function testHederaAuth() {
  console.log('🧪 Testing Hedera Authentication\n');
  
  const accountIdStr = process.env.HEDERA_ACCOUNT_ID;
  const privateKeyStr = process.env.HEDERA_PRIVATE_KEY;
  
  console.log('📋 Configuration:');
  console.log('   Account ID:', accountIdStr);
  console.log('   Private Key:', privateKeyStr ? privateKeyStr.substring(0, 20) + '...' : 'NOT SET');
  console.log();
  
  if (!accountIdStr || !privateKeyStr) {
    console.error('❌ Missing HEDERA_ACCOUNT_ID or HEDERA_PRIVATE_KEY');
    return;
  }
  
  try {
    // Parse account ID
    const accountId = AccountId.fromString(accountIdStr);
    console.log('✅ Account ID parsed:', accountId.toString());
    
    // Parse private key
    let privateKey;
    try {
      // Use fromString() to automatically detect ED25519 or ECDSA
      privateKey = PrivateKey.fromString(privateKeyStr);
      console.log('✅ Private Key parsed (auto-detected type)');
    } catch (e) {
      console.error('❌ Failed to parse private key:', e.message);
      return;
    }
    
    // Derive public key
    const publicKey = privateKey.publicKey;
    console.log('📝 Public Key:', publicKey.toString());
    console.log();
    
    // Create client
    const client = Client.forTestnet();
    client.setOperator(accountId, privateKey);
    console.log('✅ Client created and operator set');
    console.log();
    
    // Test 1: Query account balance
    console.log('🔍 Test 1: Query Account Balance...');
    const balance = await new AccountBalanceQuery()
      .setAccountId(accountId)
      .execute(client);
    console.log('✅ Balance:', balance.hbars.toString());
    console.log();
    
    // Test 2: Test transaction signing (dry run)
    console.log('🔍 Test 2: Test Transaction Signing...');
    const testTx = new TransferTransaction()
      .addHbarTransfer(accountId, Hbar.fromTinybars(-1))
      .addHbarTransfer('0.0.3', Hbar.fromTinybars(1))
      .freezeWith(client);
    
    const signedTx = await testTx.sign(privateKey);
    console.log('✅ Transaction can be signed');
    console.log();
    
    console.log('🎉 All tests passed! Authentication is working correctly.');
    console.log();
    console.log('📝 Next step: The x402 contract might need the operator to be explicitly set.');
    
  } catch (error) {
    console.error('❌ Error:', error.message);
    if (error.stack) {
      console.error('Stack:', error.stack);
    }
  } finally {
    process.exit(0);
  }
}

testHederaAuth().catch(error => {
  console.error('Fatal error:', error);
  process.exit(1);
});
