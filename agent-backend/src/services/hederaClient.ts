import { Client, PrivateKey, AccountId } from '@hashgraph/sdk';

type SupportedNetwork = 'testnet' | 'previewnet' | 'mainnet';

const DEFAULT_NETWORK: SupportedNetwork = 'testnet';

let cachedClient: Client | null = null;
let cachedAccountId: AccountId | null = null;
let cachedPrivateKey: PrivateKey | null = null;

function resolveNetwork(): SupportedNetwork {
  const network = (process.env.HEDERA_NETWORK || DEFAULT_NETWORK).toLowerCase();
  if (network === 'mainnet' || network === 'testnet' || network === 'previewnet') {
    return network;
  }
  console.warn(`Unknown HEDERA_NETWORK "${network}". Falling back to ${DEFAULT_NETWORK}.`);
  return DEFAULT_NETWORK;
}

export function getHederaClient(): Client {
  if (cachedClient) {
    return cachedClient;
  }

  const accountIdRaw = process.env.HEDERA_ACCOUNT_ID;
  const privateKeyRaw = process.env.HEDERA_PRIVATE_KEY;

  if (!accountIdRaw || !privateKeyRaw) {
    throw new Error('HEDERA_ACCOUNT_ID and HEDERA_PRIVATE_KEY must be set in the environment.');
  }

  const accountId = AccountId.fromString(accountIdRaw);
  const privateKey = parsePrivateKey(privateKeyRaw);

  const network = resolveNetwork();
  const client =
    network === 'mainnet'
      ? Client.forMainnet()
      : network === 'previewnet'
        ? Client.forPreviewnet()
        : Client.forTestnet();

  cachedAccountId = accountId;
  cachedPrivateKey = privateKey;
  cachedClient = client.setOperator(accountId, privateKey);
  return cachedClient;
}

function parsePrivateKey(key: string): PrivateKey {
  try {
    // Use fromString() to automatically detect ED25519 or ECDSA
    return PrivateKey.fromString(key);
  } catch (err) {
    console.error('Failed to parse Hedera private key:', err);
    throw new Error('Invalid private key format. Ensure HEDERA_PRIVATE_KEY is correct.');
  }
}

export function getOperatorAccountId(): AccountId {
  if (!cachedAccountId) {
    getHederaClient();
  }
  if (!cachedAccountId) {
    throw new Error('Hedera account ID unavailable. Ensure getHederaClient() was called successfully.');
  }
  return cachedAccountId;
}

export function getOperatorPrivateKey(): PrivateKey {
  if (!cachedPrivateKey) {
    getHederaClient();
  }
  if (!cachedPrivateKey) {
    throw new Error('Hedera private key unavailable. Ensure getHederaClient() was called successfully.');
  }
  return cachedPrivateKey;
}
