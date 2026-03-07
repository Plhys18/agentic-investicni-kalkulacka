import React, { useState, useCallback, useEffect } from 'react';
import Header from '@/components/layout/Header';
import TabBar from '@/components/layout/TabBar';
import MortgageCalculator from '@/components/calculators/MortgageCalculator';
import ETFCalculator from '@/components/calculators/ETFCalculator';
import DCACalculator from '@/components/calculators/DCACalculator';
import ComparisonView from '@/components/calculators/ComparisonView';
import FIRECalculator from '@/components/calculators/FIRECalculator';
import TaxImpactCalculator from '@/components/calculators/TaxImpactCalculator';
import { useDarkMode } from '@/hooks/useDarkMode';
import { CurrencyProvider, type Currency } from '@/hooks/useCurrency';
import { LanguageProvider, useLanguage } from '@/hooks/useLanguage';
import { CalculatorProvider, useCalculatorStore } from '@/hooks/useCalculatorStore';
import { useShareURL, loadFromURL } from '@/hooks/useShareURL';
import { useCurrency } from '@/hooks/useCurrency';
import { Share2 } from 'lucide-react';

const RATES_TO_CZK: Record<Currency, number> = { CZK: 1, EUR: 25, USD: 23 };

const convertFn = (amount: number, from: Currency, to: Currency) => {
  if (from === to) return amount;
  const inCZK = amount * RATES_TO_CZK[from];
  return inCZK / RATES_TO_CZK[to];
};

const IndexInner: React.FC = () => {
  const { isDark, toggle } = useDarkMode();
  const [activeTab, setActiveTab] = useState(0);
  const [showDevBanner, setShowDevBanner] = useState(true);
  const { t, lang, setLang } = useLanguage();
  const { currency, setCurrency } = useCurrency();
  const store = useCalculatorStore();
  const { generateShareURL } = useShareURL(activeTab);

  // Load shared URL params on mount
  useEffect(() => {
    loadFromURL(setActiveTab, store, setCurrency, setLang);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <div className="min-h-screen bg-background">
      {showDevBanner && (
        <div className="bg-destructive text-destructive-foreground no-print">
          <div className="max-w-6xl mx-auto px-4 sm:px-6 py-3 flex items-center justify-between gap-4">
            <p className="text-sm font-bold">{t('disclaimer.dev')}</p>
            <button onClick={() => setShowDevBanner(false)} className="shrink-0 text-xs font-bold opacity-80 hover:opacity-100 px-2 py-1 rounded bg-destructive-foreground/20">✕</button>
          </div>
        </div>
      )}
      <Header isDark={isDark} toggle={toggle} />
      <TabBar activeTab={activeTab} onTabChange={setActiveTab} />
      <main className="max-w-6xl mx-auto px-4 sm:px-6 py-8">
        {/* Share button */}
        <div className="flex justify-end mb-4 no-print">
          <button
            onClick={generateShareURL}
            className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-secondary hover:bg-accent border border-border/50 transition-all duration-200 active:scale-95 text-sm font-medium text-foreground"
          >
            <Share2 size={14} />
            {t('share.button')}
          </button>
        </div>

        <div style={{ display: activeTab === 0 ? 'block' : 'none' }}><MortgageCalculator /></div>
        <div style={{ display: activeTab === 1 ? 'block' : 'none' }}><ETFCalculator /></div>
        <div style={{ display: activeTab === 2 ? 'block' : 'none' }}><ComparisonView /></div>
        <div style={{ display: activeTab === 3 ? 'block' : 'none' }}><DCACalculator /></div>
        <div style={{ display: activeTab === 4 ? 'block' : 'none' }}><FIRECalculator /></div>
        <div style={{ display: activeTab === 5 ? 'block' : 'none' }}><TaxImpactCalculator /></div>
      </main>
      <footer className="py-8 border-t border-border/50 no-print">
        <div className="flex flex-col items-center gap-4">
          <div className="flex items-center gap-4">
            <a href="https://www.youtube.com/c/VojtaZizka" target="_blank" rel="noopener noreferrer" className="p-2 rounded-full bg-secondary hover:bg-accent transition-colors" aria-label="YouTube">
              <svg viewBox="0 0 24 24" width="18" height="18" fill="currentColor" className="text-foreground"><path d="M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 0 0 .502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 0 0 2.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z"/></svg>
            </a>
            <a href="https://www.instagram.com/vojtazizka/" target="_blank" rel="noopener noreferrer" className="p-2 rounded-full bg-secondary hover:bg-accent transition-colors" aria-label="Instagram">
              <svg viewBox="0 0 24 24" width="18" height="18" fill="currentColor" className="text-foreground"><path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zM12 0C8.741 0 8.333.014 7.053.072 2.695.272.273 2.69.073 7.052.014 8.333 0 8.741 0 12c0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98C8.333 23.986 8.741 24 12 24c3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98C15.668.014 15.259 0 12 0zm0 5.838a6.162 6.162 0 1 0 0 12.324 6.162 6.162 0 0 0 0-12.324zM12 16a4 4 0 1 1 0-8 4 4 0 0 1 0 8zm6.406-11.845a1.44 1.44 0 1 0 0 2.881 1.44 1.44 0 0 0 0-2.881z"/></svg>
            </a>
            <a href="https://x.com/VojtaZizka" target="_blank" rel="noopener noreferrer" className="p-2 rounded-full bg-secondary hover:bg-accent transition-colors" aria-label="X">
              <svg viewBox="0 0 24 24" width="18" height="18" fill="currentColor" className="text-foreground"><path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"/></svg>
            </a>
            <a href="https://www.tiktok.com/@vojtazizka" target="_blank" rel="noopener noreferrer" className="p-2 rounded-full bg-secondary hover:bg-accent transition-colors" aria-label="TikTok">
              <svg viewBox="0 0 24 24" width="18" height="18" fill="currentColor" className="text-foreground"><path d="M12.525.02c1.31-.02 2.61-.01 3.91-.02.08 1.53.63 3.09 1.75 4.17 1.12 1.11 2.7 1.62 4.24 1.79v4.03c-1.44-.05-2.89-.35-4.2-.97-.57-.26-1.1-.59-1.62-.93-.01 2.92.01 5.84-.02 8.75-.08 1.4-.54 2.79-1.35 3.94-1.31 1.92-3.58 3.17-5.91 3.21-1.43.08-2.86-.31-4.08-1.03-2.02-1.19-3.44-3.37-3.65-5.71-.02-.5-.03-1-.01-1.49.18-1.9 1.12-3.72 2.58-4.96 1.66-1.44 3.98-2.13 6.15-1.72.02 1.48-.04 2.96-.04 4.44-.99-.32-2.15-.23-3.02.37-.63.41-1.11 1.04-1.36 1.75-.21.51-.15 1.07-.14 1.61.24 1.64 1.82 3.02 3.5 2.87 1.12-.01 2.19-.66 2.77-1.61.19-.33.4-.67.41-1.06.1-1.79.06-3.57.07-5.36.01-4.03-.01-8.05.02-12.07z"/></svg>
            </a>
            <a href="https://www.patreon.com/vojtazizka" target="_blank" rel="noopener noreferrer" className="p-2 rounded-full bg-secondary hover:bg-accent transition-colors" aria-label="Patreon">
              <svg viewBox="0 0 24 24" width="18" height="18" fill="currentColor" className="text-foreground"><path d="M15.386.524c-4.764 0-8.64 3.876-8.64 8.64 0 4.75 3.876 8.613 8.64 8.613 4.75 0 8.614-3.864 8.614-8.613C24 4.4 20.136.524 15.386.524zM.003 23.476h4.22V.524H.003z"/></svg>
            </a>
          </div>
          <p className="text-xs text-muted-foreground">© {new Date().getFullYear()} {t('footer.copyright')}</p>
          <p className="text-[10px] text-muted-foreground/70 max-w-xl text-center leading-relaxed mt-2">{t('disclaimer.finance')}</p>
        </div>
      </footer>
    </div>
  );
};

const CurrencyWrapper: React.FC = () => {
  const { convertAllValues } = useCalculatorStore();

  const handleCurrencyChange = useCallback((from: Currency, to: Currency) => {
    convertAllValues(from, to, convertFn);
  }, [convertAllValues]);

  return (
    <CurrencyProvider onCurrencyChange={handleCurrencyChange}>
      <IndexInner />
    </CurrencyProvider>
  );
};

const Index: React.FC = () => (
  <LanguageProvider>
    <CalculatorProvider>
      <CurrencyWrapper />
    </CalculatorProvider>
  </LanguageProvider>
);

export default Index;
