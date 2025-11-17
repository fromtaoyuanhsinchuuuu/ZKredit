/**
 * Check if receiver account is valid and active
 */
const { Client, PrivateKey, AccountId, AccountBalanceQuery, AccountInfoQuery } = require('@hashgraph/sdk');
require('dotenv').config({ path: './.env' });

async function checkReceiverAccount() {
  console.log('🔍 Checking Receiver Account\n');
  
  const accountIdStr = process.env.HEDERA_ACCOUNT_ID;
  const privateKeyStr = process.env.HEDERA_PRIVATE_KEY;
  const receiverIdStr = '0.0.7270863';
  
  console.log('📋 Checking account:', receiverIdStr);
  console.log();
  
  try {
    // Setup client
    const accountId = AccountId.fromString(accountIdStr);
    const privateKey = PrivateKey.fromString(privateKeyStr);
    const client = Client.forTestnet();
    client.setOperator(accountId, privateKey);
    
    const receiverId = AccountId.fromString(receiverIdStr);
    
    // Try to get account info
    console.log('🔍 Querying account info...');
    try {
      const accountInfo = await new AccountInfoQuery()
        .setAccountId(receiverId)
        .execute(client);
      
      console.log('✅ Account exists!');
      console.log('   Account ID:', accountInfo.accountId.toString());
      console.log('   Key:', accountInfo.key.toString().substring(0, 50) + '...');
      console.log('   Is Deleted:', accountInfo.isDeleted);
      console.log();
      
      // Get balance
      console.log('🔍 Querying account balance...');
      const balance = await new AccountBalanceQuery()
        .setAccountId(receiverId)
        .execute(client);
      console.log('✅ Balance:', balance.hbars.toString());
      
    } catch (infoError) {
      console.error('❌ Failed to get account info:', infoError.message);
      console.error('   Status:', infoError.status?.toString());
      console.log();
      console.log('🔍 This account might not exist or be deleted.');
      console.log('   Try using a different receiver account.');
    }
    
  } catch (error) {
    console.error('❌ Error:', error.message);
    if (error.stack) {
      console.error('Stack:', error.stack);
    }
  } finally {
    process.exit(0);
  }
}

checkReceiverAccount().catch(error => {
  console.error('Fatal error:', error);
  process.exit(1);
});
