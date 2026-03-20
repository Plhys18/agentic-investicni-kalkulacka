import React, { useMemo, useRef, useState } from 'react';
import SliderInput from '@/components/ui/SliderInput';
import ResultCard from '@/components/ui/ResultCard';
import ExportButtons from '@/components/ui/ExportButtons';
import { calculateCompoundInterest } from '@/lib/calculations';
import { maxAmount, maxMonthly } from '@/lib/constants';
import { formatCurrency, formatPercent } from '@/lib/formatters';
import { useCurrency } from '@/hooks/useCurrency';
import { useLanguage } from '@/hooks/useLanguage';
import { useCalculatorStore } from '@/hooks/useCalculatorStore';
import { AreaChart, Area, XAxis, YAxis, Tooltip, CartesianGrid, ResponsiveContainer } from 'recharts';
import { ChevronDown, ChevronUp } from 'lucide-react';

const ETFCalculator: React.FC = () => {
  const { currency } = useCurrency();
  const { lang, t } = useLanguage();
  const { etf, setETF } = useCalculatorStore();
  const [showTable, setShowTable] = useState(false);
  const printRef = useRef<HTMLDivElement>(null);

  const { initialInvestment, monthlyContribution, annualReturn, years } = etf;

  const result = useMemo(() => calculateCompoundInterest(initialInvestment, monthlyContribution, annualReturn, years), [initialInvestment, monthlyContribution, annualReturn, years]);
  const cagr = result.totalInvested > 0 ? (Math.pow(result.finalValue / result.totalInvested, 1 / years) - 1) * 100 : 0;

  const fc = (n: number) => formatCurrency(n, currency);

  const pdfData = {
    title: t('tab.etf'),
    inputs: {
      [t('etf.initialInvestment')]: fc(initialInvestment),
      [t('etf.monthlyContribution')]: fc(monthlyContribution),
      [t('etf.annualReturn')]: formatPercent(annualReturn),
      [t('etf.horizon')]: `${years} ${t('common.years')}`,
    },
    results: {
      [t('etf.totalValue')]: fc(result.finalValue),
      [t('etf.totalInvested')]: fc(result.totalInvested),
      [t('etf.totalReturn')]: fc(result.totalEarnings),
      [t('common.roi')]: formatPercent(result.roi),
      [t('common.cagr')]: formatPercent(cagr),
    },
  };

  return (
    <div className="max-w-6xl mx-auto space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-1000" ref={printRef}>
      <div className="flex flex-col lg:flex-row gap-8">
        {/* Inputs */}
        <div className="lg:w-1/3 space-y-8 no-print">
          <div className="calculator-card">
            <h3 className="section-title">{t('etf.params')}</h3>
            <div className="space-y-10">
              <SliderInput
                label={t('etf.initialInvestment')}
                value={initialInvestment}
                onChange={(v) => setETF({ initialInvestment: v })}
                min={0}
                max={maxAmount(currency)}
                step={50000}
                unit={currency}
              />
              <SliderInput
                label={t('etf.monthlyContribution')}
                value={monthlyContribution}
                onChange={(v) => setETF({ monthlyContribution: v })}
                min={0}
                max={maxMonthly(currency)}
                step={1000}
                unit={currency}
              />
              <SliderInput
                label={t('etf.annualReturn')}
                value={annualReturn}
                onChange={(v) => setETF({ annualReturn: v })}
                min={-10}
                max={30}
                step={0.1}
                unit="%"
              />
              <SliderInput
                label={t('etf.horizon')}
                value={years}
                onChange={(v) => setETF({ years: v })}
                min={1}
                max={50}
                step={1}
                unit={t('common.years')}
              />
            </div>
          </div>
        </div>

        {/* Results */}
        <div className="lg:w-2/3 space-y-8">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <ResultCard className="border-profit/40 bg-profit/5">
              <div className="space-y-1">
                <p className="text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground/60">
                  {t('etf.totalValue')}
                </p>
                <div className="flex items-baseline gap-2">
                  <span className="text-4xl font-black stat-value text-profit">
                    {fc(result.finalValue)}
                  </span>
                </div>
              </div>
            </ResultCard>

            <ResultCard className="border-border bg-secondary/20">
              <div className="space-y-3">
                <div className="grid grid-cols-2 gap-x-6 gap-y-3">
                  <StatItem label={t('etf.totalInvested')} value={fc(result.totalInvested)} />
                  <StatItem label={t('etf.totalReturn')} value={fc(result.totalEarnings)} className="text-profit" />
                </div>
              </div>
            </ResultCard>
          </div>

          <div className="calculator-card overflow-visible">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between mb-8 gap-4">
              <h3 className="section-title mb-0">{t('etf.portfolioGrowth')}</h3>
              <div className="flex items-center gap-4">
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 rounded-full bg-primary" />
                  <span className="text-[10px] font-black uppercase tracking-widest text-muted-foreground/60">
                    {t('etf.totalValue')}
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 rounded-full bg-muted-foreground/30" />
                  <span className="text-[10px] font-black uppercase tracking-widest text-muted-foreground/60">
                    {t('etf.invested')}
                  </span>
                </div>
              </div>
            </div>
            
            <div className="h-[400px] w-full mt-4">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={result.timeline} margin={{ top: 10, right: 10, left: 20, bottom: 0 }}>
                  <defs>
                    <linearGradient id="colorValue" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="hsl(var(--profit))" stopOpacity={0.3}/>
                      <stop offset="95%" stopColor="hsl(var(--profit))" stopOpacity={0}/>
                    </linearGradient>
                    <linearGradient id="colorInvested" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="hsl(var(--muted-foreground))" stopOpacity={0.1}/>
                      <stop offset="95%" stopColor="hsl(var(--muted-foreground))" stopOpacity={0}/>
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="hsl(var(--border))" opacity={0.5} />
                  <XAxis 
                    dataKey="year" 
                    axisLine={false}
                    tickLine={false}
                    tick={{ fontSize: 10, fontWeight: 700, fill: 'hsl(var(--muted-foreground))' }}
                    dy={10}
                  />
                  <YAxis 
                    axisLine={false}
                    tickLine={false}
                    tick={{ fontSize: 10, fontWeight: 700, fill: 'hsl(var(--muted-foreground))' }}
                    tickFormatter={(val) => `${(val / 1000000).toFixed(1)}M`}
                  />
                  <Tooltip 
                    content={({ active, payload }) => {
                      if (active && payload && payload.length) {
                        return (
                          <div className="glass-card p-4 rounded-2xl shadow-2xl border-glass-border">
                            <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground/60 mb-2">
                              {t('common.year')} {payload[0].payload.year}
                            </p>
                            <div className="space-y-1.5">
                              <div className="flex items-center justify-between gap-8">
                                <span className="text-xs font-bold text-foreground/70">{t('etf.totalValue')}</span>
                                <span className="text-xs font-black stat-value text-profit">
                                  {fc(payload[1].value as number)}
                                </span>
                              </div>
                              <div className="flex items-center justify-between gap-8">
                                <span className="text-xs font-bold text-foreground/70">{t('etf.invested')}</span>
                                <span className="text-xs font-black stat-value text-muted-foreground">
                                  {fc(payload[0].value as number)}
                                </span>
                              </div>
                            </div>
                          </div>
                        );
                      }
                      return null;
                    }}
                  />
                  <Area
                    type="monotone"
                    dataKey="invested"
                    stroke="hsl(var(--muted-foreground))"
                    strokeWidth={2}
                    strokeDasharray="5 5"
                    fillOpacity={1}
                    fill="url(#colorInvested)"
                  />
                  <Area
                    type="monotone"
                    dataKey="value"
                    stroke="hsl(var(--profit))"
                    strokeWidth={4}
                    fillOpacity={1}
                    fill="url(#colorValue)"
                  />
                </AreaChart>
              </ResponsiveContainer>
            </div>
            
            <div className="mt-8 p-6 rounded-2xl bg-secondary/30 border border-glass-border no-print">
              <div className="flex items-start gap-4">
                <div className="w-10 h-10 rounded-xl bg-profit/10 flex items-center justify-center shrink-0">
                  <TrendingUp size={20} className="text-profit" />
                </div>
                <div className="space-y-1">
                  <p className="text-xs font-bold text-foreground leading-snug">
                    {lang === 'cs' ? 'Rentabilita investice' : 'Investment profitability'}
                  </p>
                  <p className="text-[11px] text-muted-foreground/70">
                    {lang === 'cs' 
                      ? `Celkový výnos činí ${fc(result.totalEarnings)} s průměrným ročním zhodnocením ${formatPercent(cagr)}.`
                      : `Total return is ${fc(result.totalEarnings)} with an average annual appreciation of ${formatPercent(cagr)}.`
                    }
                  </p>
                </div>
              </div>
            </div>

            <div className="mt-6 flex flex-wrap gap-3 no-print">
              <ExportButtons printRef={printRef} pdfData={pdfData} tabName="etf" />
              <button 
                onClick={() => setShowTable(!showTable)} 
                className="btn-secondary flex items-center gap-2"
              >
                {showTable ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
                {showTable ? t('etf.hideTable') : t('etf.showTable')}
              </button>
            </div>

            {showTable && (
              <div className="mt-8 overflow-x-auto rounded-3xl border border-glass-border bg-card/50 overflow-hidden no-print animate-in fade-in slide-in-from-top-4 duration-500">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="bg-muted/30">
                      {[t('common.year'), t('common.value'), t('common.invested'), t('common.return')].map((h, i) => (
                        <th key={h} className={`px-4 py-4 text-[10px] font-black uppercase tracking-wider text-muted-foreground/60 ${i === 0 ? 'text-left' : 'text-right'}`}>{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody className="stat-value text-[11px]">
                    {result.timeline.map((row) => (
                      <tr key={row.year} className="border-t border-glass-border hover:bg-primary/5 transition-colors group">
                        <td className="px-4 py-2.5 font-black text-muted-foreground/40 group-hover:text-primary transition-colors">{row.year}</td>
                        <td className="px-4 py-2.5 text-right font-black text-foreground/80">{fc(row.value)}</td>
                        <td className="px-4 py-2.5 text-right font-medium">{fc(row.invested)}</td>
                        <td className="px-4 py-2.5 text-right font-bold text-profit">{fc(row.earnings)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

const StatItem: React.FC<{ label: string; value: string; className?: string }> = ({ label, value, className = 'text-foreground' }) => (
  <div>
    <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground/50 mb-1">{label}</p>
    <p className={`text-base font-bold stat-value ${className}`}>{value}</p>
  </div>
);

import { TrendingUp } from 'lucide-react';

export default ETFCalculator;
