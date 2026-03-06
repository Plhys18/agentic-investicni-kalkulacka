import React, { useMemo, useRef, useState } from 'react';
import SliderInput from '@/components/ui/SliderInput';
import ResultCard from '@/components/ui/ResultCard';
import ExportButtons from '@/components/ui/ExportButtons';
import { calculateCompoundInterest } from '@/lib/calculations';
import { formatCurrency, formatPercent } from '@/lib/formatters';
import { useCurrency } from '@/hooks/useCurrency';
import { useLanguage } from '@/hooks/useLanguage';
import { useCalculatorStore } from '@/hooks/useCalculatorStore';
import { AreaChart, Area, XAxis, YAxis, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { ChevronDown, ChevronUp } from 'lucide-react';

const ETFCalculator: React.FC = () => {
  const { currency } = useCurrency();
  const { t } = useLanguage();
  const fc = (n: number) => formatCurrency(n, currency);
  const { etf, setETF } = useCalculatorStore();
  const [showTable, setShowTable] = useState(false);
  const printRef = useRef<HTMLDivElement>(null);

  const { initialInvestment, monthlyContribution, annualReturn, years } = etf;

  const result = useMemo(() => calculateCompoundInterest(initialInvestment, monthlyContribution, annualReturn, years), [initialInvestment, monthlyContribution, annualReturn, years]);
  const cagr = result.totalInvested > 0 ? (Math.pow(result.finalValue / result.totalInvested, 1 / years) - 1) * 100 : 0;

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
    <div className="grid grid-cols-1 lg:grid-cols-[minmax(0,420px)_1fr] gap-6">
      <div className="calculator-card space-y-5">
        <p className="section-title mb-2">{t('etf.params')}</p>
        <div className="space-y-4">
          <SliderInput label={t('etf.initialInvestment')} value={initialInvestment} onChange={(v) => setETF({ initialInvestment: v })} min={0} max={30000000} step={50000} unit={currency} />
          <SliderInput label={t('etf.monthlyContribution')} value={monthlyContribution} onChange={(v) => setETF({ monthlyContribution: v })} min={0} max={500000} step={1000} unit={currency} />
          <SliderInput label={t('etf.annualReturn')} value={annualReturn} onChange={(v) => setETF({ annualReturn: v })} min={-10} max={30} step={0.1} unit="%" />
          <SliderInput label={t('etf.horizon')} value={years} onChange={(v) => setETF({ years: v })} min={1} max={50} step={1} unit={t('common.years')} />
        </div>
      </div>

      <div className="space-y-6" ref={printRef}>
        <ResultCard>
          <div className="space-y-4">
            <div>
              <p className="section-title mb-1">{t('etf.totalValue')}</p>
              <p className="text-4xl font-black text-profit stat-value tracking-tight">{fc(result.finalValue)}</p>
            </div>
            <div className="grid grid-cols-2 gap-x-6 gap-y-3">
              <StatItem label={t('etf.totalInvested')} value={fc(result.totalInvested)} />
              <StatItem label={t('etf.totalReturn')} value={fc(result.totalEarnings)} className="text-profit" />
              <StatItem label={t('common.roi')} value={formatPercent(result.roi)} />
              <StatItem label={t('common.cagr')} value={formatPercent(cagr)} />
            </div>
          </div>
        </ResultCard>

        <ExportButtons printRef={printRef} pdfData={pdfData} tabName="etf" />

        <div className="calculator-card">
          <h3 className="section-title mb-4">{t('etf.portfolioGrowth')}</h3>
          <div className="h-[300px] lg:h-[400px]">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={result.timeline}>
                <defs>
                  <linearGradient id="gradInvested" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#FACC15" stopOpacity={0.5} />
                    <stop offset="100%" stopColor="#FACC15" stopOpacity={0.05} />
                  </linearGradient>
                  <linearGradient id="gradValue" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#10b981" stopOpacity={0.5} />
                    <stop offset="100%" stopColor="#10b981" stopOpacity={0.05} />
                  </linearGradient>
                </defs>
                <XAxis dataKey="year" tick={{ fontSize: 12 }} />
                <YAxis tickFormatter={(v) => `${(v / 1000000).toFixed(1)}M`} tick={{ fontSize: 12 }} />
                <Tooltip formatter={(value: number) => fc(value)} contentStyle={{ borderRadius: 12, border: 'none', boxShadow: '0 4px 20px rgba(0,0,0,0.08)', fontFamily: 'JetBrains Mono, monospace', fontSize: 13 }} />
                <Legend />
                <Area type="monotone" dataKey="invested" name={t('etf.invested')} fill="url(#gradInvested)" stroke="#EAB308" strokeWidth={2} />
                <Area type="monotone" dataKey="value" name={t('etf.totalValue')} fill="url(#gradValue)" stroke="#10b981" strokeWidth={2} />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="calculator-card">
          <button onClick={() => setShowTable(!showTable)} className="btn-secondary flex items-center gap-2 w-full justify-center">
            {showTable ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
            {showTable ? t('etf.hideTable') : t('etf.showTable')}
          </button>
          {showTable && (
            <div className="mt-4 overflow-x-auto rounded-xl border border-border/50">
              <table className="w-full text-sm">
                <thead>
                  <tr className="bg-muted/70">
                    {[t('common.year'), t('common.value'), t('common.invested'), t('common.return')].map((h, i) => (
                      <th key={h} className={`px-3 py-2.5 text-xs font-bold uppercase tracking-wider text-muted-foreground ${i === 0 ? 'text-left' : 'text-right'}`}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody className="stat-value">
                  {result.timeline.map((row) => (
                    <tr key={row.year} className="border-t border-border/30 hover:bg-primary/5 transition-colors">
                      <td className="px-3 py-1.5">{row.year}</td>
                      <td className="px-3 py-1.5 text-right">{fc(row.value)}</td>
                      <td className="px-3 py-1.5 text-right">{fc(row.invested)}</td>
                      <td className="px-3 py-1.5 text-right text-profit">{fc(row.earnings)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

const StatItem: React.FC<{ label: string; value: string; className?: string }> = ({ label, value, className = 'text-foreground' }) => (
  <div>
    <p className="text-xs text-muted-foreground mb-0.5">{label}</p>
    <p className={`text-lg font-bold stat-value ${className}`}>{value}</p>
  </div>
);

export default ETFCalculator;
