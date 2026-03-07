import { describe, it, expect } from 'vitest';
import {
  calculateMortgagePayment,
  calculateCompoundInterest,
  calculateComparison,
} from '@/lib/calculations';

describe('calculateMortgagePayment', () => {
  it('returns zeroes for zero principal', () => {
    const result = calculateMortgagePayment({
      propertyPrice: 0, downPayment: 0, loanAmount: 0,
      interestRate: 5, loanTerm: 30, monthlyRent: 0,
      monthlyExpenses: 0, annualAppreciation: 0, vacancyRate: 0,
    });
    expect(result.monthlyPayment).toBe(0);
    expect(result.totalPaid).toBe(0);
    expect(result.amortizationSchedule).toHaveLength(0);
  });

  it('calculates correct monthly payment for standard mortgage', () => {
    const result = calculateMortgagePayment({
      propertyPrice: 5_000_000, downPayment: 1_000_000,
      loanAmount: 4_000_000, interestRate: 5.5, loanTerm: 30,
      monthlyRent: 20_000, monthlyExpenses: 5_000,
      annualAppreciation: 3, vacancyRate: 5,
    });
    // 4M CZK at 5.5% over 30 years => ~22,713 CZK/month
    expect(result.monthlyPayment).toBeCloseTo(22713, -1);
    expect(result.amortizationSchedule).toHaveLength(360);
  });

  it('handles zero interest rate', () => {
    const result = calculateMortgagePayment({
      propertyPrice: 1_200_000, downPayment: 0,
      loanAmount: 1_200_000, interestRate: 0, loanTerm: 10,
      monthlyRent: 0, monthlyExpenses: 0,
      annualAppreciation: 0, vacancyRate: 0,
    });
    expect(result.monthlyPayment).toBe(10_000);
    expect(result.totalInterest).toBe(0);
  });

  it('amortization schedule ends at zero balance', () => {
    const result = calculateMortgagePayment({
      propertyPrice: 2_000_000, downPayment: 400_000,
      loanAmount: 1_600_000, interestRate: 4, loanTerm: 20,
      monthlyRent: 0, monthlyExpenses: 0,
      annualAppreciation: 0, vacancyRate: 0,
    });
    const last = result.amortizationSchedule[result.amortizationSchedule.length - 1];
    expect(last.balance).toBeCloseTo(0, 0);
  });
});

describe('calculateCompoundInterest', () => {
  it('returns initial investment with zero return and zero contribution', () => {
    const result = calculateCompoundInterest(100_000, 0, 0, 10);
    expect(result.finalValue).toBe(100_000);
    expect(result.totalEarnings).toBe(0);
  });

  it('grows correctly with only monthly contributions at 0% return', () => {
    const result = calculateCompoundInterest(0, 1_000, 0, 5);
    // 1000 * 60 months = 60,000
    expect(result.finalValue).toBe(60_000);
    expect(result.totalInvested).toBe(60_000);
  });

  it('compounds correctly for a known scenario', () => {
    // 100k initial, 10k/month, 8% annual, 10 years
    const result = calculateCompoundInterest(100_000, 10_000, 8, 10);
    expect(result.finalValue).toBeGreaterThan(2_000_000);
    expect(result.timeline).toHaveLength(10);
    expect(result.roi).toBeGreaterThan(0);
  });

  it('handles negative returns', () => {
    const result = calculateCompoundInterest(1_000_000, 0, -10, 5);
    expect(result.finalValue).toBeLessThan(1_000_000);
    expect(result.totalEarnings).toBeLessThan(0);
  });

  it('timeline has correct year markers', () => {
    const result = calculateCompoundInterest(0, 5_000, 7, 3);
    expect(result.timeline).toHaveLength(3);
    expect(result.timeline[0].year).toBe(1);
    expect(result.timeline[2].year).toBe(3);
  });
});

describe('calculateComparison', () => {
  const defaultInputs = {
    propertyPrice: 5_000_000,
    downPayment: 1_000_000,
    loanAmount: 4_000_000,
    interestRate: 5.5,
    loanTerm: 30,
    monthlyRent: 20_000,
    monthlyExpenses: 5_000,
    annualAppreciation: 3,
    vacancyRate: 5,
  };

  it('returns timeline with correct length', () => {
    const { timeline } = calculateComparison(defaultInputs, 8, 20);
    expect(timeline).toHaveLength(20);
    expect(timeline[0].year).toBe(1);
    expect(timeline[19].year).toBe(20);
  });

  it('ETF side invests monthly (not just negative cash flow)', () => {
    // With default inputs, mortgage has positive cash flow.
    // After the fix, the ETF side must still have monthly contributions.
    const { result } = calculateComparison(defaultInputs, 8, 20);
    // ETF totalInvested should be significantly more than just the down payment
    expect(result.etf.totalInvested).toBeGreaterThan(defaultInputs.downPayment * 2);
  });

  it('winner is deterministic and one of mortgage or etf', () => {
    const { result } = calculateComparison(defaultInputs, 8, 20);
    expect(['mortgage', 'etf']).toContain(result.winner);
  });

  it('handles comparison period longer than loan term', () => {
    const { timeline, result } = calculateComparison(defaultInputs, 8, 35);
    expect(timeline).toHaveLength(35);
    // Should not throw; ETF contributions drop after loan ends
    expect(result.etf.totalValue).toBeGreaterThan(0);
  });
});
