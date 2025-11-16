import { Noir, type InputMap } from '@noir-lang/noir_js';
import { BarretenbergBackend, type ProofData } from '@noir-lang/backend_barretenberg';
import creditHistoryCircuit from '../../../zk-circuits/credit_history_proof/target/credit_history_proof.json';

const BN254_FIELD_MODULUS = 21888242871839275222246405745257275088548364400416034343698204186575808495617n;

let noirProgramPromise: Promise<Noir> | null = null;
let backendInstancePromise: Promise<BarretenbergBackend> | null = null;

interface CreditHistoryNoirInputs {
  actual_transaction_count: string;
  transaction_hash: string;
  minimum_transactions: string;
  time_range_months: string;
  worker_agent_id: string;
}

export interface CreditHistoryProofArtifacts {
  proofBase64: string;
  noirPublicInputs: string[];
}

async function getNoirProgram(): Promise<Noir> {
  if (!noirProgramPromise) {
    noirProgramPromise = (async () => {
  const program = new Noir(creditHistoryCircuit as any);
      await program.init();
      return program;
    })();
  }
  return noirProgramPromise;
}

async function getBackend(): Promise<BarretenbergBackend> {
  if (!backendInstancePromise) {
  backendInstancePromise = Promise.resolve(new BarretenbergBackend(creditHistoryCircuit as any));
  }
  return backendInstancePromise;
}

function toFieldElement(hex: string): bigint {
  const normalized = hex.startsWith('0x') ? hex : `0x${hex}`;
  const value = BigInt(normalized);
  const modded = value % BN254_FIELD_MODULUS;
  return modded >= 0n ? modded : modded + BN254_FIELD_MODULUS;
}

export async function generateCreditHistoryNoirProof(params: {
  actualTransactionCount: number;
  minimumTransactions: number;
  timeRangeMonths: number;
  workerAgentId: bigint;
  transactionMerkleRoot: string;
}): Promise<CreditHistoryProofArtifacts> {
  const noir = await getNoirProgram();
  const backend = await getBackend();

  const inputs: InputMap & CreditHistoryNoirInputs = {
    actual_transaction_count: params.actualTransactionCount.toString(),
    transaction_hash: toFieldElement(params.transactionMerkleRoot).toString(),
    minimum_transactions: params.minimumTransactions.toString(),
    time_range_months: params.timeRangeMonths.toString(),
    worker_agent_id: params.workerAgentId.toString(),
  };

  const { witness } = await noir.execute(inputs);
  const proofData = await backend.generateProof(witness);

  return {
    proofBase64: Buffer.from(proofData.proof).toString('base64'),
    noirPublicInputs: proofData.publicInputs,
  };
}

export async function verifyCreditHistoryNoirProof(artifacts: {
  proofBase64: string;
  noirPublicInputs: string[];
}): Promise<boolean> {
  const backend = await getBackend();
  const proofBuffer = Buffer.from(artifacts.proofBase64, 'base64');
  const proofData: ProofData = {
    proof: proofBuffer,
    publicInputs: artifacts.noirPublicInputs,
  };

  try {
    return await backend.verifyProof(proofData);
  } catch (error) {
    console.error('❌ Noir verification failed:', error);
    return false;
  }
}
