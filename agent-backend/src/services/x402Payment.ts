import { AccountId, Client, ContractExecuteTransaction, ContractFunctionParameters, ContractId, Hbar, TransferTransaction } from '@hashgraph/sdk';
import Long from 'long';

export type X402EnvConfig = {
  contractId: ContractId | null;
  workerAddress: string;
  receiverAddress: string;
  useDirectTransfer: boolean;
};

export type ExecuteX402PaymentParams = {
  client: Client;
  contractId: ContractId | null;
  receiverAddress: string;
  amountTinybars: bigint;
  gasLimit?: number;
  useDirectTransfer?: boolean;
};

export type ExecuteX402PaymentResult = {
  transactionId: string;
  transactionHash: string;
  status: string;
  amountTinybars: bigint;
  receiverAddress: string;
};

export const resolveContractId = (identifier: string): ContractId => {
  if (identifier.includes('.')) {
    return ContractId.fromString(identifier);
  }

  const normalized = identifier.startsWith('0x') ? identifier : `0x${identifier}`;
  return ContractId.fromSolidityAddress(normalized);
};

export const normalizeEvmAddress = (value: string): string => {
  if (!value) {
    throw new Error('Address value is empty');
  }

  // If it's a Hedera account ID format (e.g., "0.0.123456")
  if (value.includes('.')) {
    const solidityAddr = AccountId.fromString(value).toSolidityAddress();
    return `0x${solidityAddr}`;
  }

  // Ensure 0x prefix
  const withPrefix = value.startsWith('0x') ? value : `0x${value}`;
  
  // Pad short addresses to 40 hex characters (20 bytes)
  if (withPrefix.length < 42) {
    const hexPart = withPrefix.slice(2);
    return `0x${hexPart.padStart(40, '0')}`;
  }

  return withPrefix;
};

export const getX402EnvConfig = (): X402EnvConfig => {
  const contractIdentifier = process.env.X402_PAYMENT_CONTRACT_ID || process.env.NEXT_PUBLIC_X402_PAYMENT_ADDRESS;
  
  const receiverEnv =
    process.env.RECEIVER_EVM_ADDRESS ||
    process.env.RECEIVER_ACCOUNT_ADDRESS ||
    process.env.NEXT_PUBLIC_RECEIVER_ACCOUNT_ADDRESS;
  if (!receiverEnv) {
    throw new Error('RECEIVER_EVM_ADDRESS is not configured.');
  }

  const workerEnv = process.env.WORKER_EVM_ADDRESS || process.env.HEDERA_EVM_ADDRESS;
  if (!workerEnv) {
    throw new Error('WORKER_EVM_ADDRESS is not configured.');
  }

  // Check if contract ID is valid (not zero address)
  const useDirectTransfer = !contractIdentifier || 
    contractIdentifier === '0x0000000000000000000000000000000000000000' ||
    contractIdentifier === '0.0.0';

  return {
    contractId: useDirectTransfer ? null : resolveContractId(contractIdentifier),
    receiverAddress: normalizeEvmAddress(receiverEnv),
    workerAddress: normalizeEvmAddress(workerEnv),
    useDirectTransfer,
  };
};

export const executeX402Payment = async ({
  client,
  contractId,
  receiverAddress,
  amountTinybars,
  gasLimit = 600_000,
  useDirectTransfer = false,
}: ExecuteX402PaymentParams): Promise<ExecuteX402PaymentResult> => {
  const payableAmount = Hbar.fromTinybars(Number(amountTinybars));

  // If no valid contract or direct transfer mode, use simple TransferTransaction
  if (useDirectTransfer || !contractId) {
    console.log('⚡ Using direct HBAR transfer (no x402 contract)');
    
    // Convert EVM address back to AccountId
    let receiverAccountId: AccountId;
    if (receiverAddress.startsWith('0x')) {
      // Remove 0x and pad to 40 chars if needed
      const hexAddr = receiverAddress.slice(2).padStart(40, '0');
      receiverAccountId = AccountId.fromSolidityAddress(hexAddr);
    } else {
      receiverAccountId = AccountId.fromString(receiverAddress);
    }

    const transferTx = new TransferTransaction()
      .addHbarTransfer(client.operatorAccountId!, Hbar.fromTinybars(-Number(amountTinybars)))
      .addHbarTransfer(receiverAccountId, payableAmount);

    const txResponse = await transferTx.execute(client);
    const receipt = await txResponse.getReceipt(client);
    const record = await txResponse.getRecord(client);
    const hashBytes = Buffer.from(record.transactionHash);
    const transactionHash = `0x${hashBytes.toString('hex')}`;

    if (receipt.status.toString() !== 'SUCCESS') {
      throw new Error(`Direct HBAR transfer failed with status ${receipt.status.toString()}`);
    }

    return {
      transactionId: txResponse.transactionId.toString(),
      transactionHash,
      status: receipt.status.toString(),
      amountTinybars,
      receiverAddress: receiverAccountId.toString(),
    };
  }

  // Original x402 contract call logic
  const uintAmount = Long.fromNumber(Number(amountTinybars));
  const functionParams = new ContractFunctionParameters()
    .addAddress(receiverAddress)
    .addUint256(uintAmount);

  const transaction = new ContractExecuteTransaction()
    .setContractId(contractId)
    .setGas(gasLimit)
    .setFunction('pay', functionParams)
    .setPayableAmount(payableAmount);

  // Sign and execute the transaction
  const txResponse = await transaction.execute(client);
  const receipt = await txResponse.getReceipt(client);
  const record = await txResponse.getRecord(client);
  const hashBytes = Buffer.from(record.transactionHash);
  const transactionHash = `0x${hashBytes.toString('hex')}`;

  if (receipt.status.toString() !== 'SUCCESS') {
    throw new Error(`x402 payment failed with status ${receipt.status.toString()}`);
  }

  return {
    transactionId: txResponse.transactionId.toString(),
    transactionHash,
    status: receipt.status.toString(),
    amountTinybars,
    receiverAddress,
  };
};
