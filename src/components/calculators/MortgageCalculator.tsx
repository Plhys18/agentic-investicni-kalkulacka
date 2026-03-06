import React, { useState, useMemo, useRef } from 'react';
import SliderInput from '@/components/ui/SliderInput';
import InputField from '@/components/ui/InputField';
import ResultCard from '@/components/ui/ResultCard';
import ExportButtons from '@/components/ui/ExportButtons';
import { MORTGAGE_DEFAULTS } from '@/lib/constants';
import { calculateMortgagePayment } from '@/lib/calculations';
import { formatCurrency, formatPercent } from '@/lib/formatters';
import { useCurrency } from '@/hooks/useCurrency';
import { AreaChart, Area, XAxis, YAxis, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { ChevronDown, ChevronUp } from 'lucide-react';

const MortgageCalculator: React.FC = () => {
  const { currency } = useCurrency();
  const fc = (n: number) => formatCurrency(n, currency);

  const [propertyPrice, setPropertyPrice] = useState(MORTGAGE_DEFAULTS.propertyPrice);
  const [downPayment, setDownPayment] = useState(MORTGAGE_DEFAULTS.downPayment);
  const [interestRate, setInterestRate] = useState(MORTGAGE_DEFAULTS.interestRate);
  const [loanTerm, setLoanTerm] = useState(MORTGAGE_DEFAULTS.loanTerm);
  const [monthlyRent, setMonthlyRent] = useState(MORTGAGE_DEFAULTS.monthlyRent);
  const [monthlyExpenses, setMonthlyExpenses] = useState(MORTGAGE_DEFAULTS.monthlyExpenses);
  const [annualAppreciation, setAnnualAppreciation] = useState(MORTGAGE_DEFAULTS.annualAppreciation);
  const [vacancyRate, setVacancyRate] = useState(MORTGAGE_DEFAULTS.vacancyRate);
  const [showTable, setShowTable] = useState(false);
  const printRef = useRef<HTMLDivElement>(null);

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
    title: 'Hypotéka',
    inputs: {
      'Cena nemovitosti': fc(propertyPrice),
      'Vlastní zdroje': fc(downPayment),
      'Výše úvěru': fc(loanAmount),
      'Úroková sazba': formatPercent(interestRate),
      'Doba splácení': `${loanTerm} let`,
    },
    results: {
      'Měsíční splátka': fc(result.monthlyPayment),
      'Celkem zaplaceno': fc(result.totalPaid),
      'Celkem na úrocích': fc(result.totalInterest),
      'Měsíční cash flow': fc(monthlyCashFlow),
    },
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-[minmax(0,420px)_1fr] gap-6">
      <div className="calculator-card space-y-5">
        <p className="section-title mb-4">Parametry nemovitosti</p>
        <div className="space-y-4">
          <SliderInput label="Cena nemovitosti" value={propertyPrice} onChange={setPropertyPrice} min={500000} max={30000000} step={100000} unit={currency} />
          <SliderInput label="Vlastní zdroje (akontace)" value={downPayment} onChange={(v) => setDownPayment(Math.min(v, propertyPrice))} min={0} max={propertyPrice} step={50000} unit={currency} />
        </div>

        <div className="rounded-xl p-3.5 space-y-1.5 bg-primary/10">
          <div className="flex justify-between text-sm">
            <span className="text-muted-foreground">Výše úvěru</span>
            <span className="font-bold text-foreground stat-value">{fc(loanAmount)}</span>
          </div>
          <div className="flex justify-between text-sm">
            <span className="text-muted-foreground">LTV</span>
            <span className="font-bold text-foreground stat-value">{formatPercent(ltv, 0)}</span>
          </div>
        </div>

        <div className="space-y-4">
          <SliderInput label="Úroková sazba (% p.a.)" value={interestRate} onChange={setInterestRate} min={0.1} max={15} step={0.1} unit="%" />
          <SliderInput label="Doba splácení" value={loanTerm} onChange={setLoanTerm} min={1} max={40} step={1} unit="let" />
        </div>

        <div className="border-t border-border/50 pt-4">
          <p className="section-title mb-4">Příjmy a náklady</p>
          <div className="space-y-4">
            <InputField label="Měsíční nájem (příjem)" value={monthlyRent} onChange={setMonthlyRent} min={0} max={500000} step={500} unit={currency} />
            <InputField label="Měsíční náklady" value={monthlyExpenses} onChange={setMonthlyExpenses} min={0} max={200000} step={500} unit={currency} />
            <SliderInput label="Roční zhodnocení" value={annualAppreciation} onChange={setAnnualAppreciation} min={-5} max={15} step={0.1} unit="%" />
            <SliderInput label="Míra neobsazenosti" value={vacancyRate} onChange={setVacancyRate} min={0} max={50} step={1} unit="%" />
          </div>
        </div>
      </div>

      <div className="space-y-6" ref={printRef}>
        {noMortgage ? (
          <ResultCard>
            <p className="text-lg font-bold text-foreground">Bez hypotéky</p>
            <p className="text-sm text-muted-foreground">Nemovitost je plně pokryta vlastními zdroji.</p>
          </ResultCard>
        ) : (
          <>
            <ResultCard>
              <div className="space-y-4">
                <div>
                  <p className="section-title mb-1">Měsíční splátka</p>
                  <p className="text-4xl font-black text-foreground stat-value tracking-tight">{fc(result.monthlyPayment)}</p>
                </div>
                <div className="grid grid-cols-2 gap-x-6 gap-y-3">
                  <StatItem label="Celkem zaplaceno" value={fc(result.totalPaid)} />
                  <StatItem label="Celkem na úrocích" value={fc(result.totalInterest)} className="text-loss" />
                  <StatItem label="Poměr úrok/jistina" value={`${formatPercent(interestRatio, 0)} / ${formatPercent(principalRatio, 0)}`} />
                </div>
                <div className="border-t border-border/30 pt-3 grid grid-cols-2 gap-x-6">
                  <StatItem label="Měsíční cash flow" value={fc(monthlyCashFlow)} className={monthlyCashFlow >= 0 ? 'text-profit' : 'text-loss'} />
                  <StatItem label="Roční cash flow" value={fc(annualCashFlow)} className={annualCashFlow >= 0 ? 'text-profit' : 'text-loss'} />
                </div>
              </div>
            </ResultCard>

            <ExportButtons printRef={printRef} pdfData={pdfData} tabName="hypoteka" />

            <div className="calculator-card">
              <h3 className="section-title mb-4">Amortizační graf</h3>
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
                    <Tooltip formatter={(value: number) => fc(value)} contentStyle={{ borderRadius: 12, border: 'none', boxShadow: '0 4px 20px rgba(0,0,0,0.08)', fontFamily: 'JetBrains Mono, monospace', fontSize: 13 }} />
                    <Legend />
                    <Area type="monotone" dataKey="jistina" name="Jistina" stackId="1" fill="url(#gradPrincipal)" stroke="#EAB308" strokeWidth={2} />
                    <Area type="monotone" dataKey="urok" name="Úrok" stackId="1" fill="url(#gradInterest)" stroke="#ef4444" strokeWidth={2} />
                    <Area type="monotone" dataKey="zustatek" name="Zůstatek" fill="transparent" stroke="#9ca3af" strokeWidth={2} strokeDasharray="5 5" />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            </div>

            <div className="calculator-card">
              <button onClick={() => setShowTable(!showTable)} className="btn-secondary flex items-center gap-2 w-full justify-center">
                {showTable ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
                {showTable ? 'Skrýt amortizační tabulku' : 'Zobrazit amortizační tabulku'}
              </button>
              {showTable && (
                <div className="mt-4 overflow-x-auto rounded-xl border border-border/50">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="bg-muted/70">
                        {['Měsíc', 'Splátka', 'Jistina', 'Úrok', 'Zůstatek'].map((h, i) => (
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
