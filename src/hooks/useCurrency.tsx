import React, { createContext, useContext, useState } from 'react';

export type Currency = 'CZK' | 'EUR' | 'USD';

interface CurrencyContextType {
  currency: Currency;
  setCurrency: (c: Currency) => void;
}

const CurrencyContext = createContext<CurrencyContextType>({ currency: 'CZK', setCurrency: () => {} });

export const CurrencyProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [currency, setCurrency] = useState<Currency>(() => {
    const stored = localStorage.getItem('currency');
    return (stored === 'EUR' || stored === 'USD') ? stored : 'CZK';
  });

  const handleSet = (c: Currency) => {
    setCurrency(c);
    localStorage.setItem('currency', c);
  };

  return (
    <CurrencyContext.Provider value={{ currency, setCurrency: handleSet }}>
      {children}
    </CurrencyContext.Provider>
  );
};

export const useCurrency = () => useContext(CurrencyContext);
