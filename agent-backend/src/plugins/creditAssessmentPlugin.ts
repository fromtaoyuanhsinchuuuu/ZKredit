import { z } from 'zod';
import type { Client, PrivateKey } from '@hashgraph/sdk';
import { CreditAssessmentAgent1 } from '../agents/CreditAssessmentAgent1';

interface HederaTool {
  method: string;
  name: string;
  description: string;
  parameters: z.ZodObject<any>;
  execute: (client: Client, context: unknown, params: any) => Promise<any>;
}

const creditAssessmentParams = z.object({
  applicantAgentId: z.string().describe('Agent ID of the applicant requesting the loan'),
  requestedAmount: z.number().positive().describe('Requested loan amount in USD'),
  zkProofs: z.object({
    income: z.any().describe('Income proof artifact'),
    creditHistory: z.any().describe('Credit history proof artifact'),
    collateral: z.any().describe('Collateral proof artifact'),
  }),
});

type CreditAssessmentParams = z.infer<typeof creditAssessmentParams>;
type ProofBundle = Required<CreditAssessmentParams['zkProofs']>;

export interface CreditAssessmentPluginContext {
  client: Client;
  operatorKey: PrivateKey;
  agentId?: bigint;
}

function createCreditAssessmentAgent(context: CreditAssessmentPluginContext) {
  return new CreditAssessmentAgent1(
    context.agentId ?? 2n,
    context.client,
    context.operatorKey,
  );
}

export function createCreditAssessmentPluginTools(
  context: CreditAssessmentPluginContext,
): HederaTool[] {
  const creditAgent = createCreditAssessmentAgent(context);

  const runAssessmentTool: HederaTool = {
    method: 'runCreditAssessment',
    name: 'Run Credit Assessment',
    description: 'Evaluate ZKredit borrower proofs and return a loan decision summary.',
    parameters: creditAssessmentParams,
    execute: async (
      _client: Client,
      _ctx: unknown,
      params: CreditAssessmentParams,
    ) => {
      const proofs = params.zkProofs as ProofBundle;
      return creditAgent.processLoanApplication({
        applicantAgentId: params.applicantAgentId,
        requestedAmount: params.requestedAmount,
        zkProofs: proofs,
      });
    },
  };

  return [runAssessmentTool];
}
