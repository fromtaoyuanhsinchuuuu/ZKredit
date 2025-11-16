import { PrivateKey } from '@hashgraph/sdk';
import { getHederaClient, getOperatorAccountId, getOperatorPrivateKey } from './hederaClient';
import { createCreditAssessmentPluginTools } from '../plugins/creditAssessmentPlugin';

// eslint-disable-next-line @typescript-eslint/no-var-requires
const hederaKit = require('hedera-agent-kit');
const { AgentMode, HederaLangchainToolkit, hederaTools } = hederaKit;

let cachedToolkit: any = null;

function ensureToolkit(): any {
  if (cachedToolkit) {
    return cachedToolkit;
  }

  const client = getHederaClient();
  cachedToolkit = new HederaLangchainToolkit({
    client,
    configuration: {
      tools: [
        hederaTools.GET_HBAR_BALANCE_QUERY_TOOL,
        hederaTools.GET_ACCOUNT_QUERY_TOOL,
        hederaTools.TRANSFER_HBAR_TOOL,
        hederaTools.CREATE_TOPIC_TOOL,
        hederaTools.SUBMIT_TOPIC_MESSAGE_TOOL,
      ],
      context: {
        mode: AgentMode.AUTONOMOUS,
        accountId: getOperatorAccountId().toString(),
      },
    },
  });

  return cachedToolkit;
}

function getOperatorKey(): PrivateKey {
  return getOperatorPrivateKey();
}

export function getHederaToolkit() {
  return ensureToolkit();
}

export function getHederaAgentTools() {
  return ensureToolkit().getTools();
}

export function getCreditAssessmentTools() {
  const client = getHederaClient();
  const operatorKey = getOperatorKey();
  return createCreditAssessmentPluginTools({
    client,
    operatorKey,
  });
}

export function getAllAgentTools() {
  return {
    hedera: getHederaAgentTools(),
    zkredit: getCreditAssessmentTools(),
  };
}
