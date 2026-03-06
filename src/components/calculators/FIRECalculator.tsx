import React, { useMemo, useRef } from 'react';
import SliderInput from '@/components/ui/SliderInput';
import ResultCard from '@/components/ui/ResultCard';
import ExportButtons from '@/components/ui/ExportButtons';
import { formatCurrency, formatPercent, formatNumber } from '@/lib/formatters';
import { useCurrency } from '@/hooks/useCurrency';
import { useLanguage } from '@/hooks/useLanguage';
import { useCalculatorStore } from '@/hooks/useCalculatorStore';
import { AreaChart, Area, XAxis, YAxis, Tooltip, Legend, ResponsiveContainer, ReferenceLine } from 'recharts';
import { Flame, Target, TrendingUp, Calendar } from 'lucide-react';

const FIRECalculator: React.FC = () => {
  const { currency } = useCurrency();
  const { t } = useLanguage();
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

  const fireAge = useMemo(() => {
    // Assume current age ~30 for display purposes
    return Math.round(30 + results.yearsToFIRE);
  }, [results.yearsToFIRE]);

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
    <div className="grid grid-cols-1 lg:grid-cols-[minmax(0,420px)_1fr] gap-6">
      <div className="calculator-card space-y-5">
        <div className="flex items-center gap-2.5 mb-1">
          <div className="w-8 h-8 rounded-lg bg-orange-500/10 flex items-center justify-center">
            <Flame size={18} className="text-orange-500" />
          </div>
          <p className="section-title">{t('fire.title')}</p>
        </div>

        <div className="space-y-4">
          <SliderInput label={t('fire.currentSavings')} value={currentSavings} onChange={(v) => setFIRE({ currentSavings: v })} min={0} max={50000000} step={50000} unit={currency} />
          <SliderInput label={t('fire.monthlyIncome')} value={monthlyIncome} onChange={(v) => setFIRE({ monthlyIncome: v })} min={0} max={1000000} step={1000} unit={currency} />
          <SliderInput label={t('fire.monthlyExpenses')} value={monthlyExpenses} onChange={(v) => setFIRE({ monthlyExpenses: v })} min={0} max={500000} step={1000} unit={currency} />
          <SliderInput label={t('fire.monthlySavings')} value={monthlySavings} onChange={(v) => setFIRE({ monthlySavings: v })} min={0} max={500000} step={1000} unit={currency} />
          <SliderInput label={t('fire.annualReturn')} value={annualReturn} onChange={(v) => setFIRE({ annualReturn: v })} min={1} max={20} step={0.5} unit="%" />
          <SliderInput label={t('fire.withdrawalRate')} value={withdrawalRate} onChange={(v) => setFIRE({ withdrawalRate: v })} min={2} max={6} step={0.25} unit="%" />
        </div>
        <p className="text-[10px] text-muted-foreground leading-tight">{t('fire.withdrawalDesc')}</p>
      </div>

      <div className="space-y-6" ref={printRef}>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <ResultCard>
            <div className="flex items-center gap-2 mb-2">
              <Target size={16} className="text-orange-500" />
              <p className="section-title">{t('fire.fireTarget')}</p>
            </div>
            <p className="text-2xl font-black stat-value text-orange-500">{fc(results.fireTarget)}</p>
          </ResultCard>
          <ResultCard>
            <div className="flex items-center gap-2 mb-2">
              <Calendar size={16} className="text-primary" />
              <p className="section-title">{t('fire.yearsToFIRE')}</p>
            </div>
            <p className="text-2xl font-black stat-value text-primary">
              {results.reached ? `${formatNumber(results.yearsToFIRE, 1)} ${t('common.years')}` : `50+ ${t('common.years')}`}
            </p>
          </ResultCard>
          <ResultCard>
            <div className="flex items-center gap-2 mb-2">
              <TrendingUp size={16} className="text-profit" />
              <p className="section-title">{t('fire.savingsRate')}</p>
            </div>
            <p className="text-2xl font-black stat-value text-profit">{formatPercent(results.savingsRate)}</p>
            <p className="text-[10px] text-muted-foreground mt-1">{t('fire.savingsRateDesc')}</p>
          </ResultCard>
        </div>

        <ExportButtons printRef={printRef} pdfData={pdfData} tabName="fire" />

        <div className="calculator-card">
          <h3 className="section-title mb-4">{t('fire.journeyChart')}</h3>
          <div className="h-[350px] lg:h-[450px]">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={results.timeline}>
                <defs>
                  <linearGradient id="grad-fire-savings" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="hsl(var(--primary))" stopOpacity={0.4} />
                    <stop offset="100%" stopColor="hsl(var(--primary))" stopOpacity={0.03} />
                  </linearGradient>
                </defs>
                <XAxis dataKey="year" tick={{ fontSize: 12 }} label={{ value: t('common.years'), position: 'bottom', offset: -5, fontSize: 11 }} />
                <YAxis tickFormatter={(v) => `${(v / 1000000).toFixed(1)}M`} tick={{ fontSize: 12 }} />
                <Tooltip
                  formatter={(value: number, name: string) => [fc(value), name]}
                  contentStyle={{ borderRadius: 12, border: 'none', boxShadow: '0 4px 20px rgba(0,0,0,0.08)', fontFamily: 'JetBrains Mono, monospace', fontSize: 13 }}
                />
                <Legend />
                <ReferenceLine y={results.fireTarget} stroke="#F97316" strokeDasharray="6 4" strokeWidth={2} label={{ value: `FIRE: ${fc(results.fireTarget)}`, position: 'right', fontSize: 11, fill: '#F97316' }} />
                <Area type="monotone" dataKey="savings" name={t('fire.portfolio')} fill="url(#grad-fire-savings)" stroke="hsl(var(--primary))" strokeWidth={2.5} />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        <ResultCard>
          <h3 className="section-title mb-3">{t('fire.summary')}</h3>
          <div className="grid grid-cols-2 gap-4 text-sm">
            <div>
              <p className="text-xs text-muted-foreground">{t('fire.monthlyPassiveIncome')}</p>
              <p className="font-bold stat-value text-foreground">{fc(results.fireTarget * (withdrawalRate / 100) / 12)}</p>
            </div>
            <div>
              <p className="text-xs text-muted-foreground">{t('fire.annualPassiveIncome')}</p>
              <p className="font-bold stat-value text-foreground">{fc(results.fireTarget * (withdrawalRate / 100))}</p>
            </div>
            <div>
              <p className="text-xs text-muted-foreground">{t('fire.totalInvested')}</p>
              <p className="font-bold stat-value text-foreground">{fc(results.totalInvested)}</p>
            </div>
            <div>
              <p className="text-xs text-muted-foreground">{t('fire.totalReturn')}</p>
              <p className="font-bold stat-value text-profit">{fc(results.totalReturn)}</p>
            </div>
          </div>
        </ResultCard>
      </div>
    </div>
  );
};

export default FIRECalculator;
