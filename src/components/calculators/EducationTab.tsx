import React, { useState } from 'react';
import { useLanguage } from '@/hooks/useLanguage';
import { Play, BookOpen, ChevronDown, ChevronUp, ExternalLink } from 'lucide-react';

interface VideoLink {
  titleCs: string;
  titleEn: string;
  url: string;
  descCs: string;
  descEn: string;
}

interface GlossaryItem {
  termCs: string;
  termEn: string;
  defCs: string;
  defEn: string;
}

const videos: VideoLink[] = [
  {
    titleCs: 'Jak začít investovat do ETF',
    titleEn: 'How to Start Investing in ETFs',
    url: 'https://www.youtube.com/watch?v=dQw4w9WgXcQ',
    descCs: 'Kompletní průvodce pro začátečníky — co jsou ETF, jak si vybrat a kde koupit.',
    descEn: 'Complete beginner guide — what are ETFs, how to choose and where to buy.',
  },
  {
    titleCs: 'Nemovitost vs. investice — co se vyplatí víc?',
    titleEn: 'Real Estate vs. Investing — Which Pays Off More?',
    url: 'https://www.youtube.com/watch?v=yKIbPktAOYs',
    descCs: 'Rozbor nemovitosti vs. investování — reálná čísla a srovnání obou přístupů.',
    descEn: 'Analysis of real estate vs. investing — real numbers and comparison of both approaches.',
  },
  {
    titleCs: 'Co je FIRE a jak dosáhnout finanční nezávislosti',
    titleEn: 'What is FIRE and How to Achieve Financial Independence',
    url: 'https://www.youtube.com/watch?v=dQw4w9WgXcQ',
    descCs: 'Pravidlo 4 %, míra úspor a praktické tipy pro cestu k FIRE.',
    descEn: 'The 4% rule, savings rate, and practical tips for the path to FIRE.',
  },
  {
    titleCs: 'DCA strategie — pravidelné investování krok za krokem',
    titleEn: 'DCA Strategy — Regular Investing Step by Step',
    url: 'https://www.youtube.com/watch?v=dQw4w9WgXcQ',
    descCs: 'Proč je DCA nejlepší strategie pro většinu investorů a jak na to.',
    descEn: 'Why DCA is the best strategy for most investors and how to do it.',
  },
  {
    titleCs: 'Daně z investic v ČR — co potřebujete vědět',
    titleEn: 'Investment Taxes in Czech Republic — What You Need to Know',
    url: 'https://www.youtube.com/watch?v=dQw4w9WgXcQ',
    descCs: 'Přehled daňových pravidel pro akcie, ETF, krypto a nemovitosti.',
    descEn: 'Overview of tax rules for stocks, ETFs, crypto, and real estate.',
  },
];

const glossary: GlossaryItem[] = [
  { termCs: 'ETF (Exchange-Traded Fund)', termEn: 'ETF (Exchange-Traded Fund)', defCs: 'Burzovně obchodovaný fond, který sleduje index (např. S&P 500). Umožňuje levnou a diverzifikovanou investici do stovek akcií najednou.', defEn: 'A fund traded on stock exchanges that tracks an index (e.g., S&P 500). Allows cheap and diversified investment in hundreds of stocks at once.' },
  { termCs: 'DCA (Dollar-Cost Averaging)', termEn: 'DCA (Dollar-Cost Averaging)', defCs: 'Strategie pravidelného investování fixní částky bez ohledu na aktuální cenu. Snižuje riziko špatného načasování trhu.', defEn: 'Strategy of investing a fixed amount regularly regardless of current price. Reduces the risk of bad market timing.' },
  { termCs: 'FIRE (Financial Independence, Retire Early)', termEn: 'FIRE (Financial Independence, Retire Early)', defCs: 'Hnutí zaměřené na dosažení finanční nezávislosti co nejdříve — díky vysoké míře úspor a investování.', defEn: 'Movement focused on achieving financial independence as early as possible — through high savings rate and investing.' },
  { termCs: 'Složené úročení', termEn: 'Compound Interest', defCs: 'Úrok počítaný nejen z jistiny, ale i z dříve připsaných úroků. Albert Einstein ho údajně nazval „osmým divem světa".', defEn: 'Interest calculated not only on the principal but also on previously accrued interest. Albert Einstein allegedly called it "the eighth wonder of the world".' },
  { termCs: 'CAGR (Compound Annual Growth Rate)', termEn: 'CAGR (Compound Annual Growth Rate)', defCs: 'Průměrné roční zhodnocení investice při zohlednění složeného úročení. Přesnější než prostý průměr výnosů.', defEn: 'Average annual return of an investment accounting for compounding. More accurate than a simple average of returns.' },
  { termCs: 'Amortizace', termEn: 'Amortization', defCs: 'Proces postupného splácení dluhu pravidelnými splátkami, které obsahují úrok i jistinu.', defEn: 'The process of gradually repaying a debt through regular payments that include both interest and principal.' },
  { termCs: 'LTV (Loan-to-Value)', termEn: 'LTV (Loan-to-Value)', defCs: 'Poměr výše hypotéky k hodnotě nemovitosti. Čím nižší LTV, tím menší riziko pro banku a obvykle lepší úrok.', defEn: 'Ratio of the mortgage amount to the property value. Lower LTV means less risk for the bank and usually a better interest rate.' },
  { termCs: 'SWR (Safe Withdrawal Rate)', termEn: 'SWR (Safe Withdrawal Rate)', defCs: 'Bezpečná míra výběru z portfolia — typicky 4 % ročně. Zajišťuje, že peníze vydrží 30+ let.', defEn: 'Safe rate of withdrawal from a portfolio — typically 4% per year. Ensures the money lasts 30+ years.' },
  { termCs: 'Diverzifikace', termEn: 'Diversification', defCs: 'Rozložení investice do více aktiv (akcie, dluhopisy, nemovitosti) za účelem snížení rizika.', defEn: 'Spreading investments across multiple assets (stocks, bonds, real estate) to reduce risk.' },
  { termCs: 'Volatilita', termEn: 'Volatility', defCs: 'Míra kolísání ceny aktiva. Vysoká volatilita = větší výkyvy nahoru i dolů. Typická pro krypto a růstové akcie.', defEn: 'Measure of price fluctuation of an asset. High volatility = bigger swings up and down. Typical for crypto and growth stocks.' },
  { termCs: 'P/E Ratio (Price-to-Earnings)', termEn: 'P/E Ratio (Price-to-Earnings)', defCs: 'Poměr ceny akcie k zisku na akcii. Pomáhá posoudit, zda je akcie „drahá" nebo „levná" vůči ziskům firmy.', defEn: 'Ratio of share price to earnings per share. Helps assess whether a stock is "expensive" or "cheap" relative to the company\'s earnings.' },
  { termCs: 'Inflace', termEn: 'Inflation', defCs: 'Všeobecný růst cenové hladiny v čase. Snižuje kupní sílu peněz — 100 Kč dnes koupí méně než před 10 lety.', defEn: 'General increase in price levels over time. Reduces purchasing power — $100 today buys less than 10 years ago.' },
  { termCs: 'Reálný vs. nominální výnos', termEn: 'Real vs. Nominal Return', defCs: 'Nominální výnos = hrubý výnos. Reálný výnos = po odečtení inflace. Pro dlouhodobé plánování je důležitější reálný výnos.', defEn: 'Nominal return = gross return. Real return = after subtracting inflation. Real return matters more for long-term planning.' },
  { termCs: 'TER (Total Expense Ratio)', termEn: 'TER (Total Expense Ratio)', defCs: 'Celkové roční náklady fondu vyjádřené v procentech. U pasivních ETF typicky 0,07–0,50 %.', defEn: 'Total annual cost of a fund expressed as a percentage. For passive ETFs, typically 0.07–0.50%.' },
  { termCs: 'Likvidita', termEn: 'Liquidity', defCs: 'Schopnost rychle prodat aktivum za tržní cenu. Akcie a ETF mají vysokou likviditu, nemovitosti nízkou.', defEn: 'Ability to quickly sell an asset at market price. Stocks and ETFs have high liquidity, real estate has low liquidity.' },
];

const EducationTab: React.FC = () => {
  const { lang, t } = useLanguage();
  const [openTerms, setOpenTerms] = useState<Set<number>>(new Set());

  const toggleTerm = (idx: number) => {
    setOpenTerms(prev => {
      const next = new Set(prev);
      next.has(idx) ? next.delete(idx) : next.add(idx);
      return next;
    });
  };

  const expandAll = () => setOpenTerms(new Set(glossary.map((_, i) => i)));
  const collapseAll = () => setOpenTerms(new Set());

  return (
    <div className="space-y-8">
      {/* Videos Section */}
      <section>
        <div className="flex items-center gap-3 mb-5">
          <div className="p-2.5 rounded-xl bg-primary/10">
            <Play size={22} className="text-primary" />
          </div>
          <div>
            <h2 className="text-xl font-bold text-foreground">{t('edu.videos')}</h2>
            <p className="text-sm text-muted-foreground">{t('edu.videosDesc')}</p>
          </div>
        </div>
        <div className="grid gap-4 sm:grid-cols-2">
          {videos.map((v, i) => (
            <a
              key={i}
              href={v.url}
              target="_blank"
              rel="noopener noreferrer"
              className="group flex flex-col gap-2 p-4 rounded-2xl border border-border/50 bg-card hover:border-primary/40 hover:shadow-lg hover:shadow-primary/5 transition-all duration-200"
            >
              <div className="flex items-start justify-between gap-2">
                <h3 className="font-semibold text-foreground group-hover:text-primary transition-colors text-sm sm:text-base leading-snug">
                  {lang === 'cs' ? v.titleCs : v.titleEn}
                </h3>
                <ExternalLink size={14} className="shrink-0 mt-1 text-muted-foreground group-hover:text-primary transition-colors" />
              </div>
              <p className="text-xs sm:text-sm text-muted-foreground leading-relaxed">
                {lang === 'cs' ? v.descCs : v.descEn}
              </p>
            </a>
          ))}
        </div>
      </section>

      {/* Glossary Section */}
      <section>
        <div className="flex items-center justify-between mb-5">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-accent/50">
              <BookOpen size={22} className="text-foreground" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-foreground">{t('edu.glossary')}</h2>
              <p className="text-sm text-muted-foreground">{t('edu.glossaryDesc')}</p>
            </div>
          </div>
          <button
            onClick={openTerms.size === glossary.length ? collapseAll : expandAll}
            className="text-xs font-medium text-primary hover:underline whitespace-nowrap"
          >
            {openTerms.size === glossary.length ? t('edu.collapseAll') : t('edu.expandAll')}
          </button>
        </div>
        <div className="space-y-2">
          {glossary.map((item, i) => {
            const isOpen = openTerms.has(i);
            return (
              <div
                key={i}
                className="rounded-xl border border-border/50 bg-card overflow-hidden transition-all duration-200"
              >
                <button
                  onClick={() => toggleTerm(i)}
                  className="w-full flex items-center justify-between px-4 py-3 text-left hover:bg-muted/30 transition-colors"
                >
                  <span className="font-medium text-sm sm:text-base text-foreground">
                    {lang === 'cs' ? item.termCs : item.termEn}
                  </span>
                  {isOpen ? <ChevronUp size={16} className="shrink-0 text-muted-foreground" /> : <ChevronDown size={16} className="shrink-0 text-muted-foreground" />}
                </button>
                {isOpen && (
                  <div className="px-4 pb-4 pt-0">
                    <p className="text-sm text-muted-foreground leading-relaxed">
                      {lang === 'cs' ? item.defCs : item.defEn}
                    </p>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </section>
    </div>
  );
};

export default EducationTab;
