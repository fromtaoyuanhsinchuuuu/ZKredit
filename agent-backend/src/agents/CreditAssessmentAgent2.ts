import { CreditAssessmentAgent1 } from './CreditAssessmentAgent1';

export class CreditAssessmentAgent2 extends CreditAssessmentAgent1 {
  protected async makeDecisionWithAI(
    creditScore: number,
    requestedAmount: number,
    verificationResults: any,
    zkAttributes?: Record<string, any>
  ) {
    // Agent 2 considers zkAttributes for better decisions
    const hasStableRemittance = zkAttributes?.stable_remitter || false;
    const adjustedAmount = hasStableRemittance ? 200 : 150;
    const adjustedRate = hasStableRemittance ? 9 : 10;
    
    return {
      approved: true,
      maxAmount: adjustedAmount,
      interestRate: adjustedRate,
      reason: hasStableRemittance
        ? 'Commercial DeFi LP offer with stable remittance bonus for Middle East → Philippines corridor borrowers with zk_verified histories.'
        : 'Commercial DeFi LP offer for Middle East → Philippines corridor borrowers with zk_verified histories.',
      aiAnalysis: JSON.stringify({
        creditScore,
        requestedAmount,
        verificationResults,
        zkAttributes,
        repaymentPlan: {
          months: 4,
          installment: (adjustedAmount / 4).toFixed(2),
        },
        corridor: 'MENA->PHL',
        notes: hasStableRemittance
          ? 'A2 decision generated offline for demo. Bonus amount for stable remitter behavior.'
          : 'A2 decision generated offline for demo. Standard offer for corridor.',
      }),
      repaymentMonths: 4,
    } as const;
  }

  protected fallbackDecision(_creditScore: number, _requestedAmount: number) {
    return {
      approved: true,
      maxAmount: 150,
      interestRate: 10,
      reason: 'Fallback decision: 150 USD over 4 months at 10% APR (Agent 2).',
      aiAnalysis: 'Fallback path for Agent 2',
      repaymentMonths: 4,
    } as const;
  }
}
