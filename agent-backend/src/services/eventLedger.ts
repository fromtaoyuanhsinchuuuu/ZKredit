import crypto from 'crypto';

export type RemittanceEvent = {
  eventId: string;
  workerAgentId: string;
  remittanceAgentId: string;
  receiverAgentId: string;
  corridor: string;
  amount: number;
  fee: number;
  netAmount: number;
  currency: string;
  transactionHash: string;
  timestamp: number;
  hcsTopic: string;
};

export type LoanDisbursementEvent = {
  eventId: string;
  workerAgentId: string;
  creditAgentId: string;
  amount: number;
  interestRate: number;
  tenureMonths: number;
  fundingAccount: string;
  transactionHash: string;
  timestamp: number;
  corridor: string;
  notes?: string;
};

const remittanceEvents: RemittanceEvent[] = [];
const loanDisbursementEvents: LoanDisbursementEvent[] = [];

const DEFAULT_HCS_TOPIC = process.env.HCS_TOPIC_ID || '0.0.920393';
const ZK_INPUT_WINDOW_MONTHS = 6;

const generateEventId = (prefix: string) => `${prefix}_${crypto.randomBytes(8).toString('hex')}`;

export const recordRemittanceEvent = (event: Omit<RemittanceEvent, 'eventId' | 'hcsTopic'> & { hcsTopic?: string }) => {
  const finalized: RemittanceEvent = {
    eventId: generateEventId('remit'),
    hcsTopic: event.hcsTopic || DEFAULT_HCS_TOPIC,
    ...event,
  };

  remittanceEvents.push(finalized);
  console.log('🧾 HCS RemittanceEvent published:', {
    eventId: finalized.eventId,
    topic: finalized.hcsTopic,
    corridor: finalized.corridor,
    worker: finalized.workerAgentId,
    receiver: finalized.receiverAgentId,
    amount: finalized.amount,
    timestamp: finalized.timestamp,
  });

  return finalized;
};

export const recordLoanDisbursementEvent = (event: Omit<LoanDisbursementEvent, 'eventId'>) => {
  const finalized: LoanDisbursementEvent = {
    eventId: generateEventId('loan'),
    ...event,
  };

  loanDisbursementEvents.push(finalized);
  console.log('🏦 HCS LoanDisbursementEvent published:', {
    eventId: finalized.eventId,
    worker: finalized.workerAgentId,
    agent: finalized.creditAgentId,
    amount: finalized.amount,
    rate: finalized.interestRate,
    tenureMonths: finalized.tenureMonths,
    txHash: finalized.transactionHash,
  });

  return finalized;
};

export const getRemittanceEventsForWorker = (workerAgentId: string) =>
  remittanceEvents.filter(event => event.workerAgentId === workerAgentId).sort((a, b) => b.timestamp - a.timestamp);

export const summarizeRemittanceHistory = (workerAgentId: string) => {
  const now = Date.now();
  const cutoff = now - ZK_INPUT_WINDOW_MONTHS * 30 * 24 * 60 * 60 * 1000;
  const history = getRemittanceEventsForWorker(workerAgentId);
  const windowEvents = history.filter(event => event.timestamp >= cutoff);

  const monthsCovered = new Set(
    windowEvents.map(event => {
      const date = new Date(event.timestamp);
      return `${date.getUTCFullYear()}-${date.getUTCMonth()}`;
    })
  ).size;

  const totalVolume = windowEvents.reduce((sum, event) => sum + event.amount, 0);
  const firstEvent = history[history.length - 1];
  const accountAgeMonths = firstEvent
    ? Math.max(1, Math.floor((now - firstEvent.timestamp) / (30 * 24 * 60 * 60 * 1000)))
    : 0;

  const totalTransactions = windowEvents.length;

  return {
    monthsWithRemittance: monthsCovered,
    totalVolume,
    accountAgeMonths,
    totalTransactions,
    events: windowEvents,
  };
};

export const deriveZkAttributesFromRemittances = (workerAgentId: string) => {
  const summary = summarizeRemittanceHistory(workerAgentId);

  const stableRemitter = summary.monthsWithRemittance >= 3;
  let totalBand: '0-300' | '300-600' | '600-900' | '900+' = '0-300';
  if (summary.totalVolume >= 900) {
    totalBand = '900+';
  } else if (summary.totalVolume >= 600) {
    totalBand = '600-900';
  } else if (summary.totalVolume >= 300) {
    totalBand = '300-600';
  }

  let accountAgeBand: '0-3m' | '3-6m' | '6-12m' | '12m+' = '0-3m';
  if (summary.accountAgeMonths >= 12) {
    accountAgeBand = '12m+';
  } else if (summary.accountAgeMonths >= 6) {
    accountAgeBand = '6-12m';
  } else if (summary.accountAgeMonths >= 3) {
    accountAgeBand = '3-6m';
  }

  return {
    stable_remitter: stableRemitter,
    total_remitted_band: totalBand,
    account_age_band: accountAgeBand,
    months_with_activity: summary.monthsWithRemittance,
    total_transactions: summary.totalTransactions,
  };
};

export const getLoanDisbursementEvents = () => [...loanDisbursementEvents];
