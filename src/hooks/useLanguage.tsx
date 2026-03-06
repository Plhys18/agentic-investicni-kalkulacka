import React, { createContext, useContext, useState } from 'react';

export type Lang = 'cs' | 'en';

interface LanguageContextType {
  lang: Lang;
  setLang: (l: Lang) => void;
  t: (key: string) => string;
}

const translations: Record<string, Record<Lang, string>> = {
  // Header
  'app.title': { cs: 'Investiční Kalkulačka', en: 'Investment Calculator' },
  'app.subtitle': { cs: 'Hypotéka vs. ETF — porovnejte své investice', en: 'Mortgage vs. ETF — compare your investments' },

  // Tabs
  'tab.mortgage': { cs: 'Hypotéka', en: 'Mortgage' },
  'tab.etf': { cs: 'Spoření & ETF', en: 'Savings & ETF' },
  'tab.comparison': { cs: 'Hypotéka vs ETF', en: 'Mortgage vs ETF' },
  'tab.dca': { cs: 'DCA Investice', en: 'DCA Investing' },

  // Mortgage
  'mortgage.params': { cs: 'Parametry nemovitosti', en: 'Property parameters' },
  'mortgage.propertyPrice': { cs: 'Cena nemovitosti', en: 'Property price' },
  'mortgage.downPayment': { cs: 'Vlastní zdroje (akontace)', en: 'Down payment' },
  'mortgage.loanAmount': { cs: 'Výše úvěru', en: 'Loan amount' },
  'mortgage.interestRate': { cs: 'Úroková sazba (% p.a.)', en: 'Interest rate (% p.a.)' },
  'mortgage.loanTerm': { cs: 'Doba splácení', en: 'Loan term' },
  'mortgage.incomeExpenses': { cs: 'Příjmy a náklady', en: 'Income & expenses' },
  'mortgage.monthlyRent': { cs: 'Měsíční nájem (příjem)', en: 'Monthly rent (income)' },
  'mortgage.monthlyExpenses': { cs: 'Měsíční náklady', en: 'Monthly expenses' },
  'mortgage.appreciation': { cs: 'Roční zhodnocení', en: 'Annual appreciation' },
  'mortgage.vacancy': { cs: 'Míra neobsazenosti', en: 'Vacancy rate' },
  'mortgage.monthlyPayment': { cs: 'Měsíční splátka', en: 'Monthly payment' },
  'mortgage.totalPaid': { cs: 'Celkem zaplaceno', en: 'Total paid' },
  'mortgage.totalInterest': { cs: 'Celkem na úrocích', en: 'Total interest' },
  'mortgage.interestPrincipalRatio': { cs: 'Poměr úrok/jistina', en: 'Interest/principal ratio' },
  'mortgage.monthlyCashFlow': { cs: 'Měsíční cash flow', en: 'Monthly cash flow' },
  'mortgage.annualCashFlow': { cs: 'Roční cash flow', en: 'Annual cash flow' },
  'mortgage.noMortgage': { cs: 'Bez hypotéky', en: 'No mortgage' },
  'mortgage.noMortgageDesc': { cs: 'Nemovitost je plně pokryta vlastními zdroji.', en: 'Property is fully covered by own funds.' },
  'mortgage.amortChart': { cs: 'Amortizační graf', en: 'Amortization chart' },
  'mortgage.showTable': { cs: 'Zobrazit amortizační tabulku', en: 'Show amortization table' },
  'mortgage.hideTable': { cs: 'Skrýt amortizační tabulku', en: 'Hide amortization table' },
  'mortgage.principal': { cs: 'Jistina', en: 'Principal' },
  'mortgage.interest': { cs: 'Úrok', en: 'Interest' },
  'mortgage.balance': { cs: 'Zůstatek', en: 'Balance' },
  'mortgage.month': { cs: 'Měsíc', en: 'Month' },
  'mortgage.payment': { cs: 'Splátka', en: 'Payment' },

  // ETF
  'etf.params': { cs: 'Parametry ETF investice', en: 'ETF investment parameters' },
  'etf.initialInvestment': { cs: 'Počáteční investice', en: 'Initial investment' },
  'etf.monthlyContribution': { cs: 'Měsíční vklad', en: 'Monthly contribution' },
  'etf.annualReturn': { cs: 'Očekávaný roční výnos', en: 'Expected annual return' },
  'etf.horizon': { cs: 'Investiční horizont', en: 'Investment horizon' },
  'etf.totalValue': { cs: 'Celková hodnota', en: 'Total value' },
  'etf.totalInvested': { cs: 'Celkem investováno', en: 'Total invested' },
  'etf.totalReturn': { cs: 'Celkový výnos', en: 'Total return' },
  'etf.portfolioGrowth': { cs: 'Růst portfolia', en: 'Portfolio growth' },
  'etf.showTable': { cs: 'Zobrazit tabulku po ročích', en: 'Show yearly table' },
  'etf.hideTable': { cs: 'Skrýt tabulku', en: 'Hide table' },
  'etf.invested': { cs: 'Investováno', en: 'Invested' },

  // DCA
  'dca.selectAssets': { cs: 'Vyber aktiva pro DCA', en: 'Select assets for DCA' },
  'dca.initialInvestment': { cs: 'Počáteční investice', en: 'Initial investment' },
  'dca.monthlyDCA': { cs: 'Měsíční DCA vklad', en: 'Monthly DCA amount' },
  'dca.horizon': { cs: 'Investiční horizont', en: 'Investment horizon' },
  'dca.expectedReturn': { cs: 'Předpokládaný roční výnos', en: 'Expected annual return' },
  'dca.comparisonAfter': { cs: 'Porovnání aktiv po', en: 'Asset comparison after' },
  'dca.growthOverTime': { cs: 'Růst portfolia v čase', en: 'Portfolio growth over time' },
  'dca.gold': { cs: 'Zlato', en: 'Gold' },
  'dca.silver': { cs: 'Stříbro', en: 'Silver' },
  'dca.goldDesc': { cs: 'Průměrný roční výnos ~8 % (2000–2025, stabilní uchovatel hodnoty)', en: 'Avg annual return ~8% (2000–2025, stable store of value)' },
  'dca.silverDesc': { cs: 'Průměrný roční výnos ~6 % (2000–2025, průmyslový + drahý kov)', en: 'Avg annual return ~6% (2000–2025, industrial + precious metal)' },
  'dca.btcDesc': { cs: 'Průměrný roční výnos ~60 % (2014–2025, vysoká volatilita)', en: 'Avg annual return ~60% (2014–2025, high volatility)' },
  'dca.ethDesc': { cs: 'Průměrný roční výnos ~80 % (2017–2025, extrémní volatilita)', en: 'Avg annual return ~80% (2017–2025, extreme volatility)' },

  // Comparison
  'comp.params': { cs: 'Parametry porovnání', en: 'Comparison parameters' },
  'comp.period': { cs: 'Období porovnání', en: 'Comparison period' },
  'comp.etfReturn': { cs: 'Očekávaný roční výnos ETF', en: 'Expected annual ETF return' },
  'comp.propertyParams': { cs: 'Parametry nemovitosti', en: 'Property parameters' },
  'comp.mortgageWins': { cs: 'Nemovitost vyhrává o', en: 'Property wins by' },
  'comp.etfWins': { cs: 'ETF vyhrává o', en: 'ETF wins by' },
  'comp.difference': { cs: 'Rozdíl', en: 'Difference' },
  'comp.propertyInvestment': { cs: 'Investice do nemovitosti', en: 'Property investment' },
  'comp.etfInvestment': { cs: 'Investice do ETF', en: 'ETF investment' },
  'comp.propertyValue': { cs: 'Hodnota nemovitosti', en: 'Property value' },
  'comp.remainingDebt': { cs: 'Zbývající dluh', en: 'Remaining debt' },
  'comp.cumulativeCF': { cs: 'Kumulativní cash flow', en: 'Cumulative cash flow' },
  'comp.netWorth': { cs: 'Čisté jmění', en: 'Net worth' },
  'comp.earnings': { cs: 'Výnosy', en: 'Earnings' },
  'comp.timeComparison': { cs: 'Srovnání v čase', en: 'Comparison over time' },
  'comp.mortgageNetWorth': { cs: 'Nemovitost (čisté jmění)', en: 'Property (net worth)' },
  'comp.etfPortfolio': { cs: 'ETF (hodnota portfolia)', en: 'ETF (portfolio value)' },

  // Common
  'common.year': { cs: 'Rok', en: 'Year' },
  'common.years': { cs: 'let', en: 'years' },
  'common.value': { cs: 'Hodnota', en: 'Value' },
  'common.return': { cs: 'Výnos', en: 'Return' },
  'common.roi': { cs: 'ROI', en: 'ROI' },
  'common.annualROI': { cs: 'Roční ROI', en: 'Annual ROI' },
  'common.cagr': { cs: 'Roční ROI (CAGR)', en: 'Annual ROI (CAGR)' },
  'common.exportPDF': { cs: 'Exportovat PDF', en: 'Export PDF' },
  'common.print': { cs: 'Tisknout', en: 'Print' },
  'common.totalValue': { cs: 'Celková hodnota', en: 'Total value' },
  'common.invested': { cs: 'Investováno', en: 'Invested' },

  // Footer
  'footer.copyright': { cs: 'Vojta Žižka · Investiční Kalkulačka', en: 'Vojta Žižka · Investment Calculator' },
};

const LanguageContext = createContext<LanguageContextType>({
  lang: 'cs',
  setLang: () => {},
  t: (key) => key,
});

export const LanguageProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [lang, setLangState] = useState<Lang>(() => {
    const stored = localStorage.getItem('lang');
    return stored === 'en' ? 'en' : 'cs';
  });

  const setLang = (l: Lang) => {
    setLangState(l);
    localStorage.setItem('lang', l);
  };

  const t = (key: string): string => {
    return translations[key]?.[lang] ?? key;
  };

  return (
    <LanguageContext.Provider value={{ lang, setLang, t }}>
      {children}
    </LanguageContext.Provider>
  );
};

export const useLanguage = () => useContext(LanguageContext);
