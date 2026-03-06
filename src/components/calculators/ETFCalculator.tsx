import React, { useState, useMemo, useRef } from 'react';
import SliderInput from '@/components/ui/SliderInput';
import ResultCard from '@/components/ui/ResultCard';
import ExportButtons from '@/components/ui/ExportButtons';
import { ETF_DEFAULTS } from '@/lib/constants';
import { calculateCompoundInterest } from '@/lib/calculations';
import { formatCurrency, formatPercent } from '@/lib/formatters';
import { AreaChart, Area, XAxis, YAxis, Tooltip, Legend, ResponsiveContainer } from 'recharts';

const ETFCalculator: React.FC = () => {
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
      'Počáteční investice': formatCurrency(initialInvestment),
      'Měsíční vklad': formatCurrency(monthlyContribution),
      'Očekávaný roční výnos': formatPercent(annualReturn),
      'Investiční horizont': `${years} let`,
    },
    results: {
      'Celková hodnota': formatCurrency(result.finalValue),
      'Celkem investováno': formatCurrency(result.totalInvested),
      'Celkový výnos': formatCurrency(result.totalEarnings),
      'ROI': formatPercent(result.roi),
      'Roční ROI (CAGR)': formatPercent(cagr),
    },
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      <div className="calculator-card space-y-4 lg:max-w-md">
        <h2 className="text-lg font-semibold text-foreground">Parametry ETF investice</h2>
        <SliderInput label="Počáteční investice" value={initialInvestment} onChange={setInitialInvestment} min={0} max={30000000} step={50000} unit="CZK" />
        <SliderInput label="Měsíční vklad" value={monthlyContribution} onChange={setMonthlyContribution} min={0} max={500000} step={1000} unit="CZK" />
        <SliderInput label="Očekávaný roční výnos" value={annualReturn} onChange={setAnnualReturn} min={-10} max={30} step={0.1} unit="%" />
        <SliderInput label="Investiční horizont" value={years} onChange={setYears} min={1} max={50} step={1} unit="let" />
      </div>

      <div className="space-y-6" ref={printRef}>
        <ResultCard>
          <div className="space-y-3">
            <div>
              <span className="text-sm text-muted-foreground">Celková hodnota</span>
              <p className="text-3xl font-bold text-profit [font-variant-numeric:tabular-nums]">{formatCurrency(result.finalValue)}</p>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <span className="text-sm text-muted-foreground">Celkem investováno</span>
                <p className="text-lg font-semibold text-foreground [font-variant-numeric:tabular-nums]">{formatCurrency(result.totalInvested)}</p>
              </div>
              <div>
                <span className="text-sm text-muted-foreground">Celkový výnos</span>
                <p className="text-lg font-semibold text-profit [font-variant-numeric:tabular-nums]">{formatCurrency(result.totalEarnings)}</p>
              </div>
              <div>
                <span className="text-sm text-muted-foreground">ROI</span>
                <p className="text-lg font-semibold text-foreground">{formatPercent(result.roi)}</p>
              </div>
              <div>
                <span className="text-sm text-muted-foreground">Roční ROI (CAGR)</span>
                <p className="text-lg font-semibold text-foreground">{formatPercent(cagr)}</p>
              </div>
            </div>
          </div>
        </ResultCard>

        <ExportButtons printRef={printRef} pdfData={pdfData} tabName="etf" />

        <div className="calculator-card">
          <h3 className="text-lg font-semibold text-foreground mb-4">Růst portfolia</h3>
          <ResponsiveContainer width="100%" height={window.innerWidth < 1024 ? 300 : 400}>
            <AreaChart data={result.timeline}>
              <XAxis dataKey="year" label={{ value: 'Rok', position: 'insideBottom', offset: -5 }} />
              <YAxis tickFormatter={(v) => `${(v / 1000000).toFixed(1)}M`} />
              <Tooltip formatter={(value: number) => formatCurrency(value)} />
              <Legend />
              <Area type="monotone" dataKey="invested" name="Investováno" stackId="1" fill="#3b82f6" stroke="#3b82f6" />
              <Area type="monotone" dataKey="value" name="Celková hodnota" fill="#10b981" stroke="#10b981" fillOpacity={0.3} />
            </AreaChart>
          </ResponsiveContainer>
        </div>

        <div className="calculator-card">
          <button onClick={() => setShowTable(!showTable)} className="btn-primary text-sm">
            {showTable ? 'Skrýt tabulku' : 'Zobrazit tabulku po ročích'}
          </button>
          {showTable && (
            <div className="mt-4 overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="bg-muted">
                    <th className="px-3 py-2 text-left">Rok</th>
                    <th className="px-3 py-2 text-right">Hodnota</th>
                    <th className="px-3 py-2 text-right">Investováno</th>
                    <th className="px-3 py-2 text-right">Výnos</th>
                  </tr>
                </thead>
                <tbody className="[font-variant-numeric:tabular-nums]">
                  {result.timeline.map((row) => (
                    <tr key={row.year} className={row.year % 2 === 0 ? 'bg-muted/50' : ''}>
                      <td className="px-3 py-1">{row.year}</td>
                      <td className="px-3 py-1 text-right">{formatCurrency(row.value)}</td>
                      <td className="px-3 py-1 text-right">{formatCurrency(row.invested)}</td>
                      <td className="px-3 py-1 text-right text-profit">{formatCurrency(row.earnings)}</td>
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

export default ETFCalculator;
