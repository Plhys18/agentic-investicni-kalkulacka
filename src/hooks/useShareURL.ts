import { useCallback } from 'react';
import { useCalculatorStore } from '@/hooks/useCalculatorStore';
import { useCurrency, type Currency } from '@/hooks/useCurrency';
import { useLanguage, type Lang } from '@/hooks/useLanguage';
import { toast } from 'sonner';

export function useShareURL(activeTab: number) {
  const store = useCalculatorStore();
  const { currency } = useCurrency();
  const { lang, t } = useLanguage();

  const generateShareURL = useCallback(() => {
    const params = new URLSearchParams();
    params.set('tab', String(activeTab));
    params.set('cur', currency);
    params.set('lang', lang);

    // Encode current tab's data
    if (activeTab === 0) {
      const m = store.mortgage;
      params.set('m', JSON.stringify([m.propertyPrice, m.downPayment, m.interestRate, m.loanTerm, m.monthlyRent, m.monthlyExpenses, m.annualAppreciation, m.vacancyRate]));
    } else if (activeTab === 1) {
      const e = store.etf;
      params.set('e', JSON.stringify([e.initialInvestment, e.monthlyContribution, e.annualReturn, e.years]));
    } else if (activeTab === 2) {
      const c = store.comparison;
      params.set('c', JSON.stringify([c.comparisonYears, c.etfReturn]));
    } else if (activeTab === 3) {
      const d = store.dca;
      params.set('d', JSON.stringify([d.initialInvestment, d.monthlyInvestment, d.years, d.selectedAssets]));
    } else if (activeTab === 4) {
      const f = store.fire;
      params.set('f', JSON.stringify([f.currentSavings, f.monthlyIncome, f.monthlyExpenses, f.monthlySavings, f.annualReturn, f.withdrawalRate]));
    } else if (activeTab === 5) {
      const x = store.tax;
      params.set('x', JSON.stringify([x.investmentAmount, x.investmentYears, x.etfGrossReturn, x.realEstateGrossReturn, x.cryptoGrossReturn, x.etfTaxRate, x.realEstateTaxRate, x.cryptoTaxRate]));
    }

    const url = `${window.location.origin}${window.location.pathname}?${params.toString()}`;
    navigator.clipboard.writeText(url).then(() => {
      toast.success(t('share.copied'));
    }).catch(() => {
      // Fallback
      prompt(t('share.copyManual'), url);
    });
  }, [activeTab, store, currency, lang, t]);

  return { generateShareURL };
}

export function loadFromURL(
  setTab: (n: number) => void,
  store: ReturnType<typeof useCalculatorStore>,
  setCurrency: (c: Currency) => void,
  setLang: (l: Lang) => void,
) {
  const params = new URLSearchParams(window.location.search);
  
  // Skip if no calculator params
  if (!params.has('tab')) return;

  const tab = Number(params.get('tab') || 0);
  setTab(tab);

  if (params.has('cur')) setCurrency(params.get('cur') as Currency);
  if (params.has('lang')) setLang(params.get('lang') as Lang);

  try {
    if (params.has('m')) {
      const [propertyPrice, downPayment, interestRate, loanTerm, monthlyRent, monthlyExpenses, annualAppreciation, vacancyRate] = JSON.parse(params.get('m')!);
      store.setMortgage({ propertyPrice, downPayment, interestRate, loanTerm, monthlyRent, monthlyExpenses, annualAppreciation, vacancyRate });
    }
    if (params.has('e')) {
      const [initialInvestment, monthlyContribution, annualReturn, years] = JSON.parse(params.get('e')!);
      store.setETF({ initialInvestment, monthlyContribution, annualReturn, years });
    }
    if (params.has('c')) {
      const [comparisonYears, etfReturn] = JSON.parse(params.get('c')!);
      store.setComparison({ comparisonYears, etfReturn });
    }
    if (params.has('d')) {
      const [initialInvestment, monthlyInvestment, years, selectedAssets] = JSON.parse(params.get('d')!);
      store.setDCA({ initialInvestment, monthlyInvestment, years, selectedAssets });
    }
    if (params.has('f')) {
      const [currentSavings, monthlyIncome, monthlyExpenses, monthlySavings, annualReturn, withdrawalRate] = JSON.parse(params.get('f')!);
      store.setFIRE({ currentSavings, monthlyIncome, monthlyExpenses, monthlySavings, annualReturn, withdrawalRate });
    }
    if (params.has('x')) {
      const [investmentAmount, investmentYears, etfGrossReturn, realEstateGrossReturn, cryptoGrossReturn, etfTaxRate, realEstateTaxRate, cryptoTaxRate] = JSON.parse(params.get('x')!);
      store.setTax({ investmentAmount, investmentYears, etfGrossReturn, realEstateGrossReturn, cryptoGrossReturn, etfTaxRate, realEstateTaxRate, cryptoTaxRate });
    }
  } catch (e) {
    console.warn('Failed to parse shared URL params', e);
  }

  // Clean URL
  window.history.replaceState({}, '', window.location.pathname);
}
