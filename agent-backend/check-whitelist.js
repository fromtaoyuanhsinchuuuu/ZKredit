const { Client, PrivateKey, AccountId, ContractId, ContractCallQuery, ContractFunctionParameters } = require('@hashgraph/sdk');
require('dotenv').config({ path: './.env' });

(async () => {
  const client = Client.forTestnet();
  const operatorId = AccountId.fromString(process.env.HEDERA_ACCOUNT_ID);
  const operatorKey = PrivateKey.fromString(process.env.HEDERA_PRIVATE_KEY);
  client.setOperator(operatorId, operatorKey);

  const contractId = ContractId.fromString(process.env.X402_PAYMENT_CONTRACT_ID);
  const receiver = process.env.RECEIVER_EVM_ADDRESS.includes('.')
    ? `0x${AccountId.fromString(process.env.RECEIVER_EVM_ADDRESS).toSolidityAddress()}`
    : process.env.RECEIVER_EVM_ADDRESS;

  const query = new ContractCallQuery()
    .setContractId(contractId)
    .setGas(100_000)
    .setFunction('whitelistedRecipients', new ContractFunctionParameters().addAddress(receiver));

  const result = await query.execute(client);
  console.log('Whitelist status:', result.getBool(0));
})();
