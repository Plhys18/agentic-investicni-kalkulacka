import React, { createContext, useContext, useState, useCallback, useRef } from 'react';

export type Currency = 'CZK' | 'EUR' | 'USD';

const RATES_TO_CZK: Record<Currency, number> = { CZK: 1, EUR: 25, USD: 23 };

interface CurrencyContextType {
  currency: Currency;
  setCurrency: (c: Currency) => void;
  convert: (amount: number, from: Currency, to: Currency) => number;
}

const CurrencyContext = createContext<CurrencyContextType>({
  currency: 'CZK',
  setCurrency: () => {},
  convert: (a) => a,
});

export const CurrencyProvider: React.FC<{
  children: React.ReactNode;
  onCurrencyChange?: (from: Currency, to: Currency) => void;
}> = ({ children, onCurrencyChange }) => {
  const [currency, setCurrencyState] = useState<Currency>(() => {
    const stored = localStorage.getItem('currency');
    return (stored === 'EUR' || stored === 'USD') ? stored : 'CZK';
  });

  const prevCurrency = useRef(currency);

  const convert = useCallback((amount: number, from: Currency, to: Currency): number => {
    if (from === to) return amount;
    const inCZK = amount * RATES_TO_CZK[from];
    return inCZK / RATES_TO_CZK[to];
  }, []);

  const setCurrency = useCallback((c: Currency) => {
    const prev = prevCurrency.current;
    prevCurrency.current = c;
    setCurrencyState(c);
    localStorage.setItem('currency', c);
    if (prev !== c && onCurrencyChange) {
      onCurrencyChange(prev, c);
    }
  }, [onCurrencyChange]);

  return (
    <CurrencyContext.Provider value={{ currency, setCurrency, convert }}>
      {children}
    </CurrencyContext.Provider>
  );
};

export const useCurrency = () => useContext(CurrencyContext);
