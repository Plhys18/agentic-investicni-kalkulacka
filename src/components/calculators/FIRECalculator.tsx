import React, { useMemo, useRef } from 'react';
import SliderInput from '@/components/ui/SliderInput';
import ResultCard from '@/components/ui/ResultCard';
import ExportButtons from '@/components/ui/ExportButtons';
import { formatCurrency, formatPercent, formatNumber } from '@/lib/formatters';
import { maxAmount, maxMonthly } from '@/lib/constants';
import { useCurrency } from '@/hooks/useCurrency';
import { useLanguage } from '@/hooks/useLanguage';
import { useCalculatorStore } from '@/hooks/useCalculatorStore';
import { AreaChart, Area, XAxis, YAxis, Tooltip, Legend, ResponsiveContainer, ReferenceLine, CartesianGrid } from 'recharts';
import { Flame, Target, TrendingUp, Calendar, Bot } from 'lucide-react';

const FIRECalculator: React.FC = () => {
  const { currency } = useCurrency();
  const { lang, t } = useLanguage();
  const fc = (n: number) => formatCurrency(n, currency);
  const { fire, setFIRE } = useCalculatorStore();
  const printRef = useRef<HTMLDivElement>(null);

  const { currentSavings, monthlyIncome, monthlyExpenses, monthlySavings, annualReturn, withdrawalRate } = fire;

  const results = useMemo(() => {
    const annualExpenses = monthlyExpenses * 12;
    const fireTarget = annualExpenses / (withdrawalRate / 100);
    
    // Simulate growth until FIRE target reached
    const monthlyRate = annualReturn / 100 / 12;
    let balance = currentSavings;
    let months = 0;
    const maxMonths = 50 * 12; // cap at 50 years
    const timeline: { year: number; savings: number; target: number }[] = [];
    
    while (balance < fireTarget && months < maxMonths) {
      balance = balance * (1 + monthlyRate) + monthlySavings;
      months++;
      if (months % 12 === 0) {
        timeline.push({
          year: months / 12,
          savings: balance,
          target: fireTarget,
        });
      }
    }

    // If we haven't added the final year yet
    if (months % 12 !== 0) {
      timeline.push({
        year: Math.ceil(months / 12),
        savings: balance,
        target: fireTarget,
      });
    }

    const yearsToFIRE = months / 12;
    const reached = balance >= fireTarget;
    const savingsRate = monthlyIncome > 0 ? (monthlySavings / monthlyIncome) * 100 : 0;
    const totalInvested = currentSavings + monthlySavings * months;
    const totalReturn = balance - totalInvested;

    // Extend timeline a bit past FIRE for visualization
    const displayYears = Math.min(Math.ceil(yearsToFIRE) + 5, 50);
    while (timeline.length < displayYears) {
      const lastYear = timeline.length > 0 ? timeline[timeline.length - 1].year : 0;
      balance = balance * (1 + monthlyRate) + monthlySavings;
      // Continue for 12 months
      for (let m = 1; m < 12; m++) {
        balance = balance * (1 + monthlyRate) + monthlySavings;
      }
      timeline.push({
        year: lastYear + 1,
        savings: balance,
        target: fireTarget,
      });
    }

    return { fireTarget, yearsToFIRE, reached, savingsRate, totalInvested, totalReturn, timeline, finalBalance: balance };
  }, [currentSavings, monthlySavings, monthlyExpenses, annualReturn, withdrawalRate, monthlyIncome]);

  const pdfData = {
    title: 'FIRE Calculator',
    inputs: {
      [t('fire.currentSavings')]: fc(currentSavings),
      [t('fire.monthlyIncome')]: fc(monthlyIncome),
      [t('fire.monthlyExpenses')]: fc(monthlyExpenses),
      [t('fire.monthlySavings')]: fc(monthlySavings),
      [t('fire.annualReturn')]: formatPercent(annualReturn),
      [t('fire.withdrawalRate')]: formatPercent(withdrawalRate),
    },
    results: {
      [t('fire.fireTarget')]: fc(results.fireTarget),
      [t('fire.yearsToFIRE')]: `${formatNumber(results.yearsToFIRE, 1)} ${t('common.years')}`,
      [t('fire.savingsRate')]: formatPercent(results.savingsRate),
    },
  };

  return (
    <div className="max-w-6xl mx-auto space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-1000" ref={printRef}>
      <div className="flex flex-col lg:flex-row gap-8">
        {/* Sidebar Inputs */}
        <div className="lg:w-1/3 space-y-8 no-print">
          <div className="calculator-card">
            <div className="flex items-center gap-3 mb-6">
              <div className="w-10 h-10 rounded-[14px] bg-orange-500/10 flex items-center justify-center border border-orange-500/20">
                <Flame size={20} className="text-orange-500" />
              </div>
              <h3 className="section-title mb-0">{t('fire.title')}</h3>
            </div>

            <div className="space-y-10">
              <SliderInput label={t('fire.currentSavings')} value={currentSavings} onChange={(v) => setFIRE({ currentSavings: v })} min={0} max={maxAmount(currency)} step={50000} unit={currency} />
              <SliderInput label={t('fire.monthlyIncome')} value={monthlyIncome} onChange={(v) => setFIRE({ monthlyIncome: v })} min={0} max={maxMonthly(currency)} step={1000} unit={currency} />
              <SliderInput label={t('fire.monthlyExpenses')} value={monthlyExpenses} onChange={(v) => setFIRE({ monthlyExpenses: v })} min={0} max={maxMonthly(currency)} step={1000} unit={currency} />
              <SliderInput label={t('fire.monthlySavings')} value={monthlySavings} onChange={(v) => setFIRE({ monthlySavings: v })} min={0} max={50000000} step={1000} unit={currency} />
              <SliderInput label={t('fire.annualReturn')} value={annualReturn} onChange={(v) => setFIRE({ annualReturn: v })} min={1} max={20} step={0.5} unit="%" />
              <SliderInput label={t('fire.withdrawalRate')} value={withdrawalRate} onChange={(v) => setFIRE({ withdrawalRate: v })} min={2} max={6} step={0.25} unit="%" />
            </div>
            
            <div className="mt-8 p-4 rounded-xl bg-secondary/30 border border-glass-border">
              <div className="flex gap-3">
                <Bot size={16} className="text-primary shrink-0 mt-0.5" />
                <p className="text-[10px] text-muted-foreground/70 leading-relaxed italic">{t('fire.withdrawalDesc')}</p>
              </div>
            </div>
          </div>
        </div>

        {/* Results Area */}
        <div className="lg:w-2/3 space-y-8">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <ResultCard className="border-orange-500/30 bg-orange-500/5">
              <div className="space-y-1">
                <p className="text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground/60">{t('fire.fireTarget')}</p>
                <p className="text-3xl font-black stat-value text-orange-500">{fc(results.fireTarget)}</p>
              </div>
            </ResultCard>

            <ResultCard className="border-profit/30 bg-profit/5">
              <div className="space-y-1">
                <p className="text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground/60">{t('fire.savingsRate')}</p>
                <p className="text-3xl font-black stat-value text-profit">{formatPercent(results.savingsRate)}</p>
              </div>
            </ResultCard>

            <ResultCard className="border-primary/30 bg-primary/5">
              <div className="space-y-1">
                <p className="text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground/60">{t('fire.yearsToFIRE')}</p>
                <p className="text-3xl font-black stat-value text-primary">
                  {results.reached ? `${formatNumber(results.yearsToFIRE, 1)} ${t('common.years')}` : `50+ ${t('common.years')}`}
                </p>
              </div>
            </ResultCard>
          </div>

          <div className="calculator-card overflow-visible">
            <h3 className="section-title mb-8">{t('fire.journeyChart')}</h3>
            <div className="h-[450px] w-full mt-4">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={results.timeline} margin={{ top: 20, right: 10, left: 20, bottom: 0 }}>
                  <defs>
                    <linearGradient id="grad-fire" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="hsl(var(--primary))" stopOpacity={0.3} />
                      <stop offset="95%" stopColor="hsl(var(--primary))" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="hsl(var(--border))" opacity={0.5} />
                  <XAxis 
                    dataKey="year" 
                    axisLine={false}
                    tickLine={false}
                    tick={{ fontSize: 10, fontWeight: 700, fill: 'hsl(var(--muted-foreground))' }}
                    dy={10}
                    label={{ value: t('common.years'), position: 'bottom', offset: -5, fontSize: 10, fontWeight: 800, fill: 'hsl(var(--muted-foreground))' }}
                  />
                  <YAxis 
                    axisLine={false}
                    tickLine={false}
                    tick={{ fontSize: 10, fontWeight: 700, fill: 'hsl(var(--muted-foreground))' }}
                    tickFormatter={(val) => `${(val / 1000000).toFixed(1)}M`}
                  />
                  <Tooltip 
                    content={({ active, payload, label }) => {
                      if (active && payload && payload.length) {
                        return (
                          <div className="glass-card p-4 rounded-2xl shadow-2xl border-glass-border">
                            <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground/60 mb-2">
                              {t('common.year')} {label}
                            </p>
                            <div className="space-y-1.5">
                              <div className="flex items-center justify-between gap-8">
                                <span className="text-xs font-bold text-foreground/70">{t('fire.portfolio')}</span>
                                <span className="text-xs font-black stat-value text-primary">
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
                  <ReferenceLine 
                    y={results.fireTarget} 
                    stroke="#F97316" 
                    strokeDasharray="8 4" 
                    strokeWidth={2} 
                    label={{ value: `FIRE`, position: 'right', fontSize: 10, fontWeight: 900, fill: '#F97316' }} 
                  />
                  <Area 
                    type="monotone" 
                    dataKey="savings" 
                    name={t('fire.portfolio')} 
                    stroke="hsl(var(--primary))" 
                    strokeWidth={4} 
                    fillOpacity={1}
                    fill="url(#grad-fire)" 
                  />
                </AreaChart>
              </ResponsiveContainer>
            </div>

            <div className="mt-12 grid grid-cols-2 sm:grid-cols-4 gap-6 pt-10 border-t border-glass-border">
              <StatItem label={t('fire.monthlyPassiveIncome')} value={fc(results.fireTarget * (withdrawalRate / 100) / 12)} />
              <StatItem label={t('fire.annualPassiveIncome')} value={fc(results.fireTarget * (withdrawalRate / 100))} />
              <StatItem label={t('fire.totalInvested')} value={fc(results.totalInvested)} />
              <StatItem label={t('fire.totalReturn')} value={fc(results.totalReturn)} className="text-profit" />
            </div>

            <div className="mt-10 flex gap-3 no-print">
              <ExportButtons printRef={printRef} pdfData={pdfData} tabName="fire" />
            </div>
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

export default FIRECalculator;
