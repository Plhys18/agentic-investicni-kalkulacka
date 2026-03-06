import type { Currency } from '@/hooks/useCurrency';

/** Max principal/lump-sum: 500 M CZK, 50 M EUR/USD */
export const maxAmount = (c: Currency) => (c === 'CZK' ? 500_000_000 : 50_000_000);
/** Max monthly: 50 M CZK, 5 M EUR/USD */
export const maxMonthly = (c: Currency) => (c === 'CZK' ? 50_000_000 : 5_000_000);

export const MORTGAGE_DEFAULTS = {
  propertyPrice: 5_000_000,
  downPayment: 1_000_000,
  interestRate: 5.5,
  loanTerm: 30,
  monthlyRent: 20_000,
  monthlyExpenses: 5_000,
  annualAppreciation: 3.0,
  vacancyRate: 5,
};

export const ETF_DEFAULTS = {
  initialInvestment: 1_000_000,
  monthlyContribution: 10_000,
  annualReturn: 8.0,
  years: 30,
};

export const COMPARISON_DEFAULTS = {
  comparisonYears: 20,
  etfReturn: 8.0,
};
