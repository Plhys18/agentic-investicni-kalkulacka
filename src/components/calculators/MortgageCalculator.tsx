import React, { useMemo, useRef, useState } from 'react';
import SliderInput from '@/components/ui/SliderInput';
import InputField from '@/components/ui/InputField';
import ResultCard from '@/components/ui/ResultCard';
import ExportButtons from '@/components/ui/ExportButtons';
import { calculateMortgagePayment } from '@/lib/calculations';
import { formatCurrency, formatPercent } from '@/lib/formatters';
import { useCurrency } from '@/hooks/useCurrency';
import { useLanguage } from '@/hooks/useLanguage';
import { useCalculatorStore } from '@/hooks/useCalculatorStore';
import { AreaChart, Area, XAxis, YAxis, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { ChevronDown, ChevronUp } from 'lucide-react';

const MortgageCalculator: React.FC = () => {
  const { currency } = useCurrency();
  const { t } = useLanguage();
  const fc = (n: number) => formatCurrency(n, currency);
  const { mortgage, setMortgage } = useCalculatorStore();
  const [showTable, setShowTable] = useState(false);
  const printRef = useRef<HTMLDivElement>(null);

  const { propertyPrice, downPayment, interestRate, loanTerm, monthlyRent, monthlyExpenses, annualAppreciation, vacancyRate } = mortgage;
  const loanAmount = Math.max(0, propertyPrice - downPayment);
  const ltv = propertyPrice > 0 ? (loanAmount / propertyPrice) * 100 : 0;

  const result = useMemo(() => calculateMortgagePayment({
    propertyPrice, downPayment, loanAmount, interestRate, loanTerm,
    monthlyRent, monthlyExpenses, annualAppreciation, vacancyRate,
  }), [propertyPrice, downPayment, loanAmount, interestRate, loanTerm, monthlyRent, monthlyExpenses, annualAppreciation, vacancyRate]);

  const effectiveRent = monthlyRent * (1 - vacancyRate / 100);
  const monthlyCashFlow = effectiveRent - monthlyExpenses - result.monthlyPayment;
  const annualCashFlow = monthlyCashFlow * 12;

  const chartData = useMemo(() => {
    const data: { rok: number; jistina: number; urok: number; zustatek: number }[] = [];
    let cumPrincipal = 0, cumInterest = 0;
    for (let year = 1; year <= loanTerm; year++) {
      const monthEnd = Math.min(year * 12, result.amortizationSchedule.length);
      for (let m = (year - 1) * 12; m < monthEnd; m++) {
        cumPrincipal += result.amortizationSchedule[m].principal;
        cumInterest += result.amortizationSchedule[m].interest;
      }
      data.push({ rok: year, jistina: Math.round(cumPrincipal), urok: Math.round(cumInterest), zustatek: Math.round(result.amortizationSchedule[monthEnd - 1]?.balance ?? 0) });
    }
    return data;
  }, [result, loanTerm]);

  const interestRatio = result.totalPaid > 0 ? (result.totalInterest / result.totalPaid) * 100 : 0;
  const principalRatio = 100 - interestRatio;
  const noMortgage = loanAmount <= 0;

  const tableRows = useMemo(() => {
    const s = result.amortizationSchedule;
    if (s.length <= 120) return { rows: s, truncated: false };
    return { first: s.slice(0, 60), last: s.slice(-60), truncated: true };
  }, [result]);

  const pdfData = {
    title: t('tab.mortgage'),
    inputs: {
      [t('mortgage.propertyPrice')]: fc(propertyPrice),
      [t('mortgage.downPayment')]: fc(downPayment),
      [t('mortgage.loanAmount')]: fc(loanAmount),
      [t('mortgage.interestRate')]: formatPercent(interestRate),
      [t('mortgage.loanTerm')]: `${loanTerm} ${t('common.years')}`,
    },
    results: {
      [t('mortgage.monthlyPayment')]: fc(result.monthlyPayment),
      [t('mortgage.totalPaid')]: fc(result.totalPaid),
      [t('mortgage.totalInterest')]: fc(result.totalInterest),
      [t('mortgage.monthlyCashFlow')]: fc(monthlyCashFlow),
    },
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-[minmax(0,420px)_1fr] gap-6">
      <div className="calculator-card space-y-5">
        <p className="section-title mb-4">{t('mortgage.params')}</p>
        <div className="space-y-4">
          <SliderInput label={t('mortgage.propertyPrice')} value={propertyPrice} onChange={(v) => setMortgage({ propertyPrice: v })} min={0} max={500000000} step={100000} unit={currency} />
          <SliderInput label={t('mortgage.downPayment')} value={downPayment} onChange={(v) => setMortgage({ downPayment: Math.min(v, propertyPrice) })} min={0} max={propertyPrice} step={50000} unit={currency} />
        </div>

        <div className="rounded-xl p-3.5 space-y-1.5 bg-primary/10">
          <div className="flex justify-between text-sm">
            <span className="text-muted-foreground">{t('mortgage.loanAmount')}</span>
            <span className="font-bold text-foreground stat-value">{fc(loanAmount)}</span>
          </div>
          <div className="flex justify-between text-sm">
            <span className="text-muted-foreground">LTV</span>
            <span className="font-bold text-foreground stat-value">{formatPercent(ltv, 0)}</span>
          </div>
        </div>

        <div className="space-y-4">
          <SliderInput label={t('mortgage.interestRate')} value={interestRate} onChange={(v) => setMortgage({ interestRate: v })} min={0.1} max={15} step={0.1} unit="%" />
          <SliderInput label={t('mortgage.loanTerm')} value={loanTerm} onChange={(v) => setMortgage({ loanTerm: v })} min={1} max={40} step={1} unit={t('common.years')} />
        </div>

        <div className="border-t border-border/50 pt-4">
          <p className="section-title mb-4">{t('mortgage.incomeExpenses')}</p>
          <div className="space-y-4">
            <InputField label={t('mortgage.monthlyRent')} value={monthlyRent} onChange={(v) => setMortgage({ monthlyRent: v })} min={0} max={50000000} step={500} unit={currency} />
            <InputField label={t('mortgage.monthlyExpenses')} value={monthlyExpenses} onChange={(v) => setMortgage({ monthlyExpenses: v })} min={0} max={50000000} step={500} unit={currency} />
            <SliderInput label={t('mortgage.appreciation')} value={annualAppreciation} onChange={(v) => setMortgage({ annualAppreciation: v })} min={-5} max={15} step={0.1} unit="%" />
            <SliderInput label={t('mortgage.vacancy')} value={vacancyRate} onChange={(v) => setMortgage({ vacancyRate: v })} min={0} max={50} step={1} unit="%" />
          </div>
        </div>
      </div>

      <div className="space-y-6" ref={printRef}>
        {noMortgage ? (
          <ResultCard>
            <p className="text-lg font-bold text-foreground">{t('mortgage.noMortgage')}</p>
            <p className="text-sm text-muted-foreground">{t('mortgage.noMortgageDesc')}</p>
          </ResultCard>
        ) : (
          <>
            <ResultCard>
              <div className="space-y-4">
                <div>
                  <p className="section-title mb-1">{t('mortgage.monthlyPayment')}</p>
                  <p className="text-4xl font-black text-foreground stat-value tracking-tight">{fc(result.monthlyPayment)}</p>
                </div>
                <div className="grid grid-cols-2 gap-x-6 gap-y-3">
                  <StatItem label={t('mortgage.totalPaid')} value={fc(result.totalPaid)} />
                  <StatItem label={t('mortgage.totalInterest')} value={fc(result.totalInterest)} className="text-loss" />
                  <StatItem label={t('mortgage.interestPrincipalRatio')} value={`${formatPercent(interestRatio, 0)} / ${formatPercent(principalRatio, 0)}`} />
                </div>
                <div className="border-t border-border/30 pt-3 grid grid-cols-2 gap-x-6">
                  <StatItem label={t('mortgage.monthlyCashFlow')} value={fc(monthlyCashFlow)} className={monthlyCashFlow >= 0 ? 'text-profit' : 'text-loss'} />
                  <StatItem label={t('mortgage.annualCashFlow')} value={fc(annualCashFlow)} className={annualCashFlow >= 0 ? 'text-profit' : 'text-loss'} />
                </div>
              </div>
            </ResultCard>

            

            <div className="calculator-card">
              <h3 className="section-title mb-4">{t('mortgage.amortChart')}</h3>
              <div className="h-[300px] lg:h-[400px]">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={chartData}>
                    <defs>
                      <linearGradient id="gradPrincipal" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0%" stopColor="#FACC15" stopOpacity={0.7} />
                        <stop offset="100%" stopColor="#FACC15" stopOpacity={0.1} />
                      </linearGradient>
                      <linearGradient id="gradInterest" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0%" stopColor="#ef4444" stopOpacity={0.6} />
                        <stop offset="100%" stopColor="#ef4444" stopOpacity={0.1} />
                      </linearGradient>
                    </defs>
                    <XAxis dataKey="rok" tick={{ fontSize: 12 }} />
                    <YAxis tickFormatter={(v) => `${(v / 1000000).toFixed(1)}M`} tick={{ fontSize: 12 }} />
                    <Tooltip formatter={(value: number) => fc(value)} contentStyle={{ borderRadius: 12, border: 'none', boxShadow: '0 4px 20px rgba(0,0,0,0.15)', fontFamily: 'JetBrains Mono, monospace', fontSize: 13, backgroundColor: 'hsl(var(--card))', color: 'hsl(var(--foreground))' }} />
                    <Legend />
                    <Area type="monotone" dataKey="jistina" name={t('mortgage.principal')} stackId="1" fill="url(#gradPrincipal)" stroke="#EAB308" strokeWidth={2} />
                    <Area type="monotone" dataKey="urok" name={t('mortgage.interest')} stackId="1" fill="url(#gradInterest)" stroke="#ef4444" strokeWidth={2} />
                    <Area type="monotone" dataKey="zustatek" name={t('mortgage.balance')} fill="transparent" stroke="#9ca3af" strokeWidth={2} strokeDasharray="5 5" />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            </div>

            <ExportButtons printRef={printRef} pdfData={pdfData} tabName="hypoteka" />

            <div className="calculator-card">
              <button onClick={() => setShowTable(!showTable)} className="btn-secondary flex items-center gap-2 w-full justify-center">
                {showTable ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
                {showTable ? t('mortgage.hideTable') : t('mortgage.showTable')}
              </button>
              {showTable && (
                <div className="mt-4 overflow-x-auto rounded-xl border border-border/50">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="bg-muted/70">
                        {[t('mortgage.month'), t('mortgage.payment'), t('mortgage.principal'), t('mortgage.interest'), t('mortgage.balance')].map((h, i) => (
                          <th key={h} className={`px-3 py-2.5 text-xs font-bold uppercase tracking-wider text-muted-foreground ${i === 0 ? 'text-left' : 'text-right'}`}>{h}</th>
                        ))}
                      </tr>
                    </thead>
                    <tbody className="stat-value">
                      {tableRows.truncated ? (
                        <>
                          {(tableRows as any).first.map((row: any) => <TableRow key={row.month} row={row} fc={fc} />)}
                          <tr><td colSpan={5} className="text-center py-3 text-muted-foreground font-sans">⋯</td></tr>
                          {(tableRows as any).last.map((row: any) => <TableRow key={row.month} row={row} fc={fc} />)}
                        </>
                      ) : (
                        (tableRows as any).rows?.map((row: any) => <TableRow key={row.month} row={row} fc={fc} />)
                      )}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </>
        )}
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

const TableRow: React.FC<{ row: any; fc: (n: number) => string }> = ({ row, fc }) => (
  <tr className="border-t border-border/30 hover:bg-primary/5 transition-colors">
    <td className="px-3 py-1.5">{row.month}</td>
    <td className="px-3 py-1.5 text-right">{fc(row.payment)}</td>
    <td className="px-3 py-1.5 text-right">{fc(row.principal)}</td>
    <td className="px-3 py-1.5 text-right">{fc(row.interest)}</td>
    <td className="px-3 py-1.5 text-right">{fc(row.balance)}</td>
  </tr>
);

export default MortgageCalculator;
