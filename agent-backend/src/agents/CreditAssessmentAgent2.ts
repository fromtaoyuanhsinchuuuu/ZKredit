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
    const adjustedRate = hasStableRemittance ? 9 : 10;
    
    return {
      approved: true,
      maxAmount: requestedAmount,
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
          installment: (requestedAmount / 4).toFixed(2),
        },
        corridor: 'MENA->PHL',
        notes: hasStableRemittance
          ? 'A2 decision generated offline for demo. Bonus rate for stable remitter behavior.'
          : 'A2 decision generated offline for demo. Standard offer for corridor.',
      }),
      repaymentMonths: 4,
    } as const;
  }

  protected fallbackDecision(creditScore: number, requestedAmount: number) {
    return {
      approved: true,
      maxAmount: requestedAmount,
      interestRate: 10,
      reason: `Fallback decision: ${requestedAmount} HBAR over 4 months at 10% APR (Agent 2).`,
      aiAnalysis: 'Fallback path for Agent 2',
      repaymentMonths: 4,
    } as const;
  }
}
