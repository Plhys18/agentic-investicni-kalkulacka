import React, { useState, useMemo, useRef } from 'react';
import SliderInput from '@/components/ui/SliderInput';
import ResultCard from '@/components/ui/ResultCard';
import ExportButtons from '@/components/ui/ExportButtons';
import { ETF_DEFAULTS } from '@/lib/constants';
import { calculateCompoundInterest } from '@/lib/calculations';
import { formatCurrency, formatPercent } from '@/lib/formatters';
import { useCurrency } from '@/hooks/useCurrency';
import { AreaChart, Area, XAxis, YAxis, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { ChevronDown, ChevronUp } from 'lucide-react';

const ETFCalculator: React.FC = () => {
  const { currency } = useCurrency();
  const fc = (n: number) => formatCurrency(n, currency);

  const [initialInvestment, setInitialInvestment] = useState(ETF_DEFAULTS.initialInvestment);
  const [monthlyContribution, setMonthlyContribution] = useState(ETF_DEFAULTS.monthlyContribution);
  const [annualReturn, setAnnualReturn] = useState(ETF_DEFAULTS.annualReturn);
  const [years, setYears] = useState(ETF_DEFAULTS.years);
  const [showTable, setShowTable] = useState(false);
  const printRef = useRef<HTMLDivElement>(null);

  const result = useMemo(() => calculateCompoundInterest(initialInvestment, monthlyContribution, annualReturn, years), [initialInvestment, monthlyContribution, annualReturn, years]);
  const cagr = result.totalInvested > 0 ? (Math.pow(result.finalValue / result.totalInvested, 1 / years) - 1) * 100 : 0;

  const pdfData = {
    title: 'ETF Kalkulačka',
    inputs: {
      'Počáteční investice': fc(initialInvestment),
      'Měsíční vklad': fc(monthlyContribution),
      'Očekávaný roční výnos': formatPercent(annualReturn),
      'Investiční horizont': `${years} let`,
    },
    results: {
      'Celková hodnota': fc(result.finalValue),
      'Celkem investováno': fc(result.totalInvested),
      'Celkový výnos': fc(result.totalEarnings),
      'ROI': formatPercent(result.roi),
      'Roční ROI (CAGR)': formatPercent(cagr),
    },
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-[minmax(0,420px)_1fr] gap-6">
      <div className="calculator-card space-y-5">
        <p className="section-title mb-2">Parametry ETF investice</p>
        <div className="space-y-4">
          <SliderInput label="Počáteční investice" value={initialInvestment} onChange={setInitialInvestment} min={0} max={30000000} step={50000} unit={currency} />
          <SliderInput label="Měsíční vklad" value={monthlyContribution} onChange={setMonthlyContribution} min={0} max={500000} step={1000} unit={currency} />
          <SliderInput label="Očekávaný roční výnos" value={annualReturn} onChange={setAnnualReturn} min={-10} max={30} step={0.1} unit="%" />
          <SliderInput label="Investiční horizont" value={years} onChange={setYears} min={1} max={50} step={1} unit="let" />
        </div>
      </div>

      <div className="space-y-6" ref={printRef}>
        <ResultCard>
          <div className="space-y-4">
            <div>
              <p className="section-title mb-1">Celková hodnota</p>
              <p className="text-4xl font-black text-profit stat-value tracking-tight">{fc(result.finalValue)}</p>
            </div>
            <div className="grid grid-cols-2 gap-x-6 gap-y-3">
              <StatItem label="Celkem investováno" value={fc(result.totalInvested)} />
              <StatItem label="Celkový výnos" value={fc(result.totalEarnings)} className="text-profit" />
              <StatItem label="ROI" value={formatPercent(result.roi)} />
              <StatItem label="Roční ROI (CAGR)" value={formatPercent(cagr)} />
            </div>
          </div>
        </ResultCard>

        <ExportButtons printRef={printRef} pdfData={pdfData} tabName="etf" />

        <div className="calculator-card">
          <h3 className="section-title mb-4">Růst portfolia</h3>
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
                <Area type="monotone" dataKey="invested" name="Investováno" fill="url(#gradInvested)" stroke="#EAB308" strokeWidth={2} />
                <Area type="monotone" dataKey="value" name="Celková hodnota" fill="url(#gradValue)" stroke="#10b981" strokeWidth={2} />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="calculator-card">
          <button onClick={() => setShowTable(!showTable)} className="btn-secondary flex items-center gap-2 w-full justify-center">
            {showTable ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
            {showTable ? 'Skrýt tabulku' : 'Zobrazit tabulku po ročích'}
          </button>
          {showTable && (
            <div className="mt-4 overflow-x-auto rounded-xl border border-border/50">
              <table className="w-full text-sm">
                <thead>
                  <tr className="bg-muted/70">
                    {['Rok', 'Hodnota', 'Investováno', 'Výnos'].map((h, i) => (
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
