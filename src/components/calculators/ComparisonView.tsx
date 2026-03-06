import React, { useMemo, useRef } from 'react';
import SliderInput from '@/components/ui/SliderInput';
import InputField from '@/components/ui/InputField';
import ResultCard from '@/components/ui/ResultCard';
import ExportButtons from '@/components/ui/ExportButtons';
import { calculateComparison } from '@/lib/calculations';
import { formatCurrency, formatPercent } from '@/lib/formatters';
import { useCurrency } from '@/hooks/useCurrency';
import { useLanguage } from '@/hooks/useLanguage';
import { useCalculatorStore } from '@/hooks/useCalculatorStore';
import { LineChart, Line, XAxis, YAxis, Tooltip, Legend, ResponsiveContainer, ReferenceLine } from 'recharts';
import { Home, TrendingUp, Trophy } from 'lucide-react';

const ComparisonView: React.FC = () => {
  const { currency } = useCurrency();
  const { t } = useLanguage();
  const fc = (n: number) => formatCurrency(n, currency);
  const { mortgage, setMortgage, comparison, setComparison } = useCalculatorStore();
  const printRef = useRef<HTMLDivElement>(null);

  const { propertyPrice, downPayment, interestRate, loanTerm, monthlyRent, monthlyExpenses, annualAppreciation, vacancyRate } = mortgage;
  const { comparisonYears, etfReturn } = comparison;
  const loanAmount = Math.max(0, propertyPrice - downPayment);

  const { result, timeline } = useMemo(() => calculateComparison(
    { propertyPrice, downPayment, loanAmount, interestRate, loanTerm, monthlyRent, monthlyExpenses, annualAppreciation, vacancyRate },
    etfReturn, comparisonYears,
  ), [propertyPrice, downPayment, loanAmount, interestRate, loanTerm, monthlyRent, monthlyExpenses, annualAppreciation, vacancyRate, etfReturn, comparisonYears]);

  const pdfData = {
    title: t('tab.comparison'),
    inputs: {
      [t('mortgage.propertyPrice')]: fc(propertyPrice),
      [t('mortgage.downPayment')]: fc(downPayment),
      [t('comp.period')]: `${comparisonYears} ${t('common.years')}`,
      [t('comp.etfReturn')]: formatPercent(etfReturn),
    },
    results: {
      [t('comp.propertyInvestment')]: fc(result.mortgage.netWorth),
      [t('comp.etfInvestment')]: fc(result.etf.totalValue),
      [t('comp.difference')]: fc(Math.abs(result.difference)),
    },
  };

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 lg:grid-cols-[minmax(0,420px)_1fr] gap-6">
        <div className="calculator-card space-y-5">
          <p className="section-title mb-2">{t('comp.params')}</p>
          <div className="space-y-4">
            <SliderInput label={t('comp.period')} value={comparisonYears} onChange={(v) => setComparison({ comparisonYears: v })} min={1} max={40} step={1} unit={t('common.years')} />
            <SliderInput label={t('comp.etfReturn')} value={etfReturn} onChange={(v) => setComparison({ etfReturn: v })} min={1} max={30} step={0.1} unit="%" />
          </div>
          <div className="border-t border-border/50 pt-4">
            <p className="section-title mb-4">{t('comp.propertyParams')}</p>
            <div className="space-y-4">
              <SliderInput label={t('mortgage.propertyPrice')} value={propertyPrice} onChange={(v) => setMortgage({ propertyPrice: v })} min={0} max={500000000} step={100000} unit={currency} />
              <SliderInput label={t('mortgage.downPayment')} value={downPayment} onChange={(v) => setMortgage({ downPayment: Math.min(v, propertyPrice) })} min={0} max={propertyPrice} step={50000} unit={currency} />
              <SliderInput label={t('mortgage.interestRate')} value={interestRate} onChange={(v) => setMortgage({ interestRate: v })} min={0.1} max={15} step={0.1} unit="%" />
              <SliderInput label={t('mortgage.loanTerm')} value={loanTerm} onChange={(v) => setMortgage({ loanTerm: v })} min={1} max={40} step={1} unit={t('common.years')} />
              <InputField label={t('mortgage.monthlyRent')} value={monthlyRent} onChange={(v) => setMortgage({ monthlyRent: v })} min={0} max={50000000} step={500} unit={currency} />
              <InputField label={t('mortgage.monthlyExpenses')} value={monthlyExpenses} onChange={(v) => setMortgage({ monthlyExpenses: v })} min={0} max={50000000} step={500} unit={currency} />
              <SliderInput label={t('mortgage.appreciation')} value={annualAppreciation} onChange={(v) => setMortgage({ annualAppreciation: v })} min={-5} max={15} step={0.1} unit="%" />
              <SliderInput label={t('mortgage.vacancy')} value={vacancyRate} onChange={(v) => setMortgage({ vacancyRate: v })} min={0} max={50} step={1} unit="%" />
            </div>
          </div>
        </div>

        <div className="space-y-6" ref={printRef}>
          <div className={`rounded-2xl p-5 flex items-center gap-4 border ${
            result.winner === 'mortgage' ? 'bg-profit/5 border-profit/20' : 'bg-primary/10 border-primary/30'
          }`}>
            <div className={`w-12 h-12 rounded-full flex items-center justify-center shrink-0 ${
              result.winner === 'mortgage' ? 'bg-profit/15' : 'bg-primary/20'
            }`}>
              <Trophy size={22} className={result.winner === 'mortgage' ? 'text-profit' : 'text-primary'} />
            </div>
            <div>
              <p className="font-black text-foreground text-lg tracking-tight">
                {result.winner === 'mortgage'
                  ? `${t('comp.mortgageWins')} ${fc(Math.abs(result.difference))}!`
                  : `${t('comp.etfWins')} ${fc(Math.abs(result.difference))}!`}
              </p>
              <p className="text-sm text-muted-foreground">{t('comp.difference')}: {formatPercent(Math.abs(result.differencePercent))}</p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <ResultCard className={result.winner === 'mortgage' ? 'ring-2 ring-profit/40 ring-offset-2 ring-offset-background' : ''}>
              <div className="flex items-center gap-2.5 mb-4">
                <div className="w-8 h-8 rounded-lg bg-profit/10 flex items-center justify-center">
                  <Home size={16} className="text-profit" />
                </div>
                <h3 className="font-bold text-foreground text-sm">{t('comp.propertyInvestment')}</h3>
              </div>
              <div className="space-y-2.5 stat-value text-sm">
                <Row label={t('comp.propertyValue')} value={fc(result.mortgage.propertyValue)} />
                <Row label={t('comp.remainingDebt')} value={fc(result.mortgage.remainingDebt)} className="text-loss" />
                <Row label={t('comp.cumulativeCF')} value={fc(result.mortgage.cumulativeCashFlow)} className={result.mortgage.cumulativeCashFlow >= 0 ? 'text-profit' : 'text-loss'} />
                <div className="border-t border-border/30 pt-2.5">
                  <p className="text-xs text-muted-foreground font-sans">{t('comp.netWorth')}</p>
                  <p className="text-2xl font-black text-foreground tracking-tight">{fc(result.mortgage.netWorth)}</p>
                </div>
                <Row label={t('common.roi')} value={formatPercent(result.mortgage.roi)} />
                <Row label={t('common.annualROI')} value={formatPercent(result.mortgage.annualROI)} />
              </div>
            </ResultCard>

            <ResultCard className={result.winner === 'etf' ? 'ring-2 ring-primary/40 ring-offset-2 ring-offset-background' : ''}>
              <div className="flex items-center gap-2.5 mb-4">
                <div className="w-8 h-8 rounded-lg bg-primary/15 flex items-center justify-center">
                  <TrendingUp size={16} className="text-primary" />
                </div>
                <h3 className="font-bold text-foreground text-sm">{t('comp.etfInvestment')}</h3>
              </div>
              <div className="space-y-2.5 stat-value text-sm">
                <Row label={t('etf.totalValue')} value={fc(result.etf.totalValue)} />
                <Row label={t('etf.totalInvested')} value={fc(result.etf.totalInvested)} />
                <Row label={t('comp.earnings')} value={fc(result.etf.earnings)} className="text-profit" />
                <div className="border-t border-border/30 pt-2.5">
                  <p className="text-xs text-muted-foreground font-sans">{t('comp.netWorth')}</p>
                  <p className="text-2xl font-black text-foreground tracking-tight">{fc(result.etf.totalValue)}</p>
                </div>
                <Row label={t('common.roi')} value={formatPercent(result.etf.roi)} />
                <Row label={t('common.annualROI')} value={formatPercent(result.etf.annualROI)} />
              </div>
            </ResultCard>
          </div>

          <ExportButtons printRef={printRef} pdfData={pdfData} tabName="porovnani" />

          <div className="calculator-card">
            <h3 className="section-title mb-4">{t('comp.timeComparison')}</h3>
            <div className="h-[350px] lg:h-[450px]">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={timeline}>
                  <XAxis dataKey="year" tick={{ fontSize: 12 }} />
                  <YAxis tickFormatter={(v) => `${(v / 1000000).toFixed(1)}M`} tick={{ fontSize: 12 }} />
                  <Tooltip formatter={(value: number) => fc(value)} contentStyle={{ borderRadius: 12, border: 'none', boxShadow: '0 4px 20px rgba(0,0,0,0.15)', fontFamily: 'JetBrains Mono, monospace', fontSize: 13, backgroundColor: 'hsl(var(--card))', color: 'hsl(var(--foreground))' }} />
                  <Legend />
                  <ReferenceLine y={downPayment} stroke="#9ca3af" strokeDasharray="3 3" />
                  <Line type="monotone" dataKey="mortgageNetWorth" name={t('comp.mortgageNetWorth')} stroke="#10b981" strokeWidth={2.5} dot={{ r: 3, fill: '#10b981' }} />
                  <Line type="monotone" dataKey="etfValue" name={t('comp.etfPortfolio')} stroke="#EAB308" strokeWidth={2.5} dot={{ r: 3, fill: '#EAB308' }} />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

const Row: React.FC<{ label: string; value: string; className?: string }> = ({ label, value, className = 'text-foreground' }) => (
  <div className="flex justify-between items-center">
    <span className="text-muted-foreground font-sans text-xs">{label}</span>
    <span className={`font-semibold ${className}`}>{value}</span>
  </div>
);

export default ComparisonView;
