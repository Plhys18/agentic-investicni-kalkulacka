import React, { createContext, useContext, useState, useCallback } from 'react';
import { MORTGAGE_DEFAULTS, ETF_DEFAULTS, COMPARISON_DEFAULTS } from '@/lib/constants';
import type { Currency } from '@/hooks/useCurrency';

interface MortgageState {
  propertyPrice: number;
  downPayment: number;
  interestRate: number;
  loanTerm: number;
  monthlyRent: number;
  monthlyExpenses: number;
  annualAppreciation: number;
  vacancyRate: number;
}

interface ETFState {
  initialInvestment: number;
  monthlyContribution: number;
  annualReturn: number;
  years: number;
}

interface DCAState {
  selectedAssets: string[];
  initialInvestment: number;
  monthlyInvestment: number;
  years: number;
  customReturns: Record<string, number>;
}

interface ComparisonState {
  comparisonYears: number;
  etfReturn: number;
}

interface CalculatorStore {
  mortgage: MortgageState;
  setMortgage: (update: Partial<MortgageState>) => void;
  etf: ETFState;
  setETF: (update: Partial<ETFState>) => void;
  dca: DCAState;
  setDCA: (update: Partial<DCAState>) => void;
  comparison: ComparisonState;
  setComparison: (update: Partial<ComparisonState>) => void;
  convertAllValues: (from: Currency, to: Currency, convertFn: (amount: number, from: Currency, to: Currency) => number) => void;
}

const CalculatorContext = createContext<CalculatorStore | null>(null);

export const CalculatorProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [mortgage, setMortgageState] = useState<MortgageState>({
    propertyPrice: MORTGAGE_DEFAULTS.propertyPrice,
    downPayment: MORTGAGE_DEFAULTS.downPayment,
    interestRate: MORTGAGE_DEFAULTS.interestRate,
    loanTerm: MORTGAGE_DEFAULTS.loanTerm,
    monthlyRent: MORTGAGE_DEFAULTS.monthlyRent,
    monthlyExpenses: MORTGAGE_DEFAULTS.monthlyExpenses,
    annualAppreciation: MORTGAGE_DEFAULTS.annualAppreciation,
    vacancyRate: MORTGAGE_DEFAULTS.vacancyRate,
  });

  const [etf, setETFState] = useState<ETFState>({
    initialInvestment: ETF_DEFAULTS.initialInvestment,
    monthlyContribution: ETF_DEFAULTS.monthlyContribution,
    annualReturn: ETF_DEFAULTS.annualReturn,
    years: ETF_DEFAULTS.years,
  });

  const [dca, setDCAState] = useState<DCAState>({
    selectedAssets: ['bitcoin'],
    initialInvestment: 0,
    monthlyInvestment: 5000,
    years: 10,
    customReturns: {},
  });

  const [comparison, setComparisonState] = useState<ComparisonState>({
    comparisonYears: COMPARISON_DEFAULTS.comparisonYears,
    etfReturn: COMPARISON_DEFAULTS.etfReturn,
  });

  const setMortgage = useCallback((update: Partial<MortgageState>) => {
    setMortgageState((prev) => ({ ...prev, ...update }));
  }, []);

  const setETF = useCallback((update: Partial<ETFState>) => {
    setETFState((prev) => ({ ...prev, ...update }));
  }, []);

  const setDCA = useCallback((update: Partial<DCAState>) => {
    setDCAState((prev) => ({ ...prev, ...update }));
  }, []);

  const setComparison = useCallback((update: Partial<ComparisonState>) => {
    setComparisonState((prev) => ({ ...prev, ...update }));
  }, []);

  const convertAllValues = useCallback((from: Currency, to: Currency, convertFn: (a: number, f: Currency, t: Currency) => number) => {
    const c = (v: number) => Math.round(convertFn(v, from, to));
    setMortgageState((prev) => ({
      ...prev,
      propertyPrice: c(prev.propertyPrice),
      downPayment: c(prev.downPayment),
      monthlyRent: c(prev.monthlyRent),
      monthlyExpenses: c(prev.monthlyExpenses),
    }));
    setETFState((prev) => ({
      ...prev,
      initialInvestment: c(prev.initialInvestment),
      monthlyContribution: c(prev.monthlyContribution),
    }));
    setDCAState((prev) => ({
      ...prev,
      initialInvestment: c(prev.initialInvestment),
      monthlyInvestment: c(prev.monthlyInvestment),
    }));
  }, []);

  return (
    <CalculatorContext.Provider value={{ mortgage, setMortgage, etf, setETF, dca, setDCA, comparison, setComparison, convertAllValues }}>
      {children}
    </CalculatorContext.Provider>
  );
};

export const useCalculatorStore = () => {
  const ctx = useContext(CalculatorContext);
  if (!ctx) throw new Error('useCalculatorStore must be used within CalculatorProvider');
  return ctx;
};
