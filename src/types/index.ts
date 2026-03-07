export interface MortgageInputs {
  propertyPrice: number;
  downPayment: number;
  loanAmount: number;
  interestRate: number;
  loanTerm: number;
  monthlyRent: number;
  monthlyExpenses: number;
  annualAppreciation: number;
  vacancyRate: number;
}

export interface ETFInputs {
  initialInvestment: number;
  monthlyContribution: number;
  annualReturn: number;
  years: number;
}

export interface AmortizationRow {
  month: number;
  payment: number;
  principal: number;
  interest: number;
  balance: number;
}

export interface MortgagePayment {
  monthlyPayment: number;
  principal: number;
  interest: number;
  totalPaid: number;
  totalInterest: number;
  amortizationSchedule: AmortizationRow[];
}

export interface CompoundInterestResult {
  finalValue: number;
  totalInvested: number;
  totalEarnings: number;
  roi: number;
  timeline: Array<{
    year: number;
    value: number;
    invested: number;
    earnings: number;
  }>;
}

export interface ComparisonResult {
  mortgage: {
    propertyValue: number;
    remainingDebt: number;
    cumulativeCashFlow: number;
    netWorth: number;
    roi: number;
    annualROI: number;
  };
  etf: {
    totalValue: number;
    totalInvested: number;
    earnings: number;
    roi: number;
    annualROI: number;
  };
  difference: number;
  differencePercent: number;
  winner: 'mortgage' | 'etf';
}

export interface ComparisonTimeline {
  year: number;
  mortgageNetWorth: number;
  etfValue: number;
}

export type TableRows =
  | { truncated: false; rows: AmortizationRow[] }
  | { truncated: true; first: AmortizationRow[]; last: AmortizationRow[] };
