import React, { useState, useMemo, useRef } from 'react';
import SliderInput from '@/components/ui/SliderInput';
import InputField from '@/components/ui/InputField';
import ResultCard from '@/components/ui/ResultCard';
import ExportButtons from '@/components/ui/ExportButtons';
import { MORTGAGE_DEFAULTS } from '@/lib/constants';
import { calculateMortgagePayment } from '@/lib/calculations';
import { formatCurrency, formatPercent } from '@/lib/formatters';
import { AreaChart, Area, XAxis, YAxis, Tooltip, Legend, ResponsiveContainer } from 'recharts';

const MortgageCalculator: React.FC = () => {
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
    let cumPrincipal = 0;
    let cumInterest = 0;
    for (let year = 1; year <= loanTerm; year++) {
      const monthEnd = Math.min(year * 12, result.amortizationSchedule.length);
      const monthStart = (year - 1) * 12;
      for (let m = monthStart; m < monthEnd; m++) {
        cumPrincipal += result.amortizationSchedule[m].principal;
        cumInterest += result.amortizationSchedule[m].interest;
      }
      data.push({ rok: year, jistina: Math.round(cumPrincipal), urok: Math.round(cumInterest), zustatek: Math.round(result.amortizationSchedule[monthEnd - 1]?.balance ?? 0) });
    }
    return data;
  }, [result, loanTerm]);

  const interestRatio = result.totalPaid > 0 ? (result.totalInterest / result.totalPaid) * 100 : 0;
  const principalRatio = 100 - interestRatio;

  const tableRows = useMemo(() => {
    const s = result.amortizationSchedule;
    if (s.length <= 120) return { rows: s, truncated: false };
    return { first: s.slice(0, 60), last: s.slice(-60), truncated: true };
  }, [result]);

  const noMortgage = loanAmount <= 0;

  const pdfData = {
    title: 'Hypotéka',
    inputs: {
      'Cena nemovitosti': formatCurrency(propertyPrice),
      'Vlastní zdroje': formatCurrency(downPayment),
      'Výše úvěru': formatCurrency(loanAmount),
      'Úroková sazba': formatPercent(interestRate),
      'Doba splácení': `${loanTerm} let`,
      'Měsíční nájem': formatCurrency(monthlyRent),
      'Měsíční náklady': formatCurrency(monthlyExpenses),
      'Roční zhodnocení': formatPercent(annualAppreciation),
      'Míra neobsazenosti': formatPercent(vacancyRate, 0),
    },
    results: {
      'Měsíční splátka': formatCurrency(result.monthlyPayment),
      'Celkem zaplaceno': formatCurrency(result.totalPaid),
      'Celkem na úrocích': formatCurrency(result.totalInterest),
      'Měsíční cash flow': formatCurrency(monthlyCashFlow),
      'Roční cash flow': formatCurrency(annualCashFlow),
    },
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      <div className="calculator-card space-y-4 lg:max-w-md">
        <h2 className="text-lg font-semibold text-foreground">Parametry hypotéky</h2>
        <SliderInput label="Cena nemovitosti" value={propertyPrice} onChange={setPropertyPrice} min={500000} max={30000000} step={100000} unit="CZK" />
        <SliderInput label="Vlastní zdroje (akontace)" value={downPayment} onChange={(v) => setDownPayment(Math.min(v, propertyPrice))} min={0} max={propertyPrice} step={50000} unit="CZK" />
        
        <div className="bg-muted rounded-lg p-3 space-y-1">
          <div className="flex justify-between text-sm">
            <span className="text-muted-foreground">Výše úvěru:</span>
            <span className="font-semibold text-foreground [font-variant-numeric:tabular-nums]">{formatCurrency(loanAmount)}</span>
          </div>
          <div className="flex justify-between text-sm">
            <span className="text-muted-foreground">LTV:</span>
            <span className="font-semibold text-foreground">{formatPercent(ltv, 0)}</span>
          </div>
        </div>

        <SliderInput label="Úroková sazba (% p.a.)" value={interestRate} onChange={setInterestRate} min={0.1} max={15} step={0.1} unit="%" />
        <SliderInput label="Doba splácení" value={loanTerm} onChange={setLoanTerm} min={1} max={40} step={1} unit="let" />

        <hr className="border-border" />
        <h3 className="text-sm font-semibold text-foreground">Příjmy a náklady</h3>
        <InputField label="Měsíční nájem (příjem)" value={monthlyRent} onChange={setMonthlyRent} min={0} max={500000} step={500} unit="CZK" />
        <InputField label="Měsíční náklady (správa, fond oprav)" value={monthlyExpenses} onChange={setMonthlyExpenses} min={0} max={200000} step={500} unit="CZK" />
        <SliderInput label="Roční zhodnocení nemovitosti" value={annualAppreciation} onChange={setAnnualAppreciation} min={-5} max={15} step={0.1} unit="%" />
        <SliderInput label="Míra neobsazenosti" value={vacancyRate} onChange={setVacancyRate} min={0} max={50} step={1} unit="%" />
      </div>

      <div className="space-y-6" ref={printRef}>
        {noMortgage ? (
          <ResultCard>
            <p className="text-lg font-semibold text-foreground">Bez hypotéky</p>
            <p className="text-sm text-muted-foreground">Nemovitost je plně pokryta vlastními zdroji.</p>
          </ResultCard>
        ) : (
          <>
            <ResultCard>
              <div className="space-y-3">
                <div>
                  <span className="text-sm text-muted-foreground">Měsíční splátka</span>
                  <p className="text-3xl font-bold text-foreground [font-variant-numeric:tabular-nums]">{formatCurrency(result.monthlyPayment)}</p>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <span className="text-sm text-muted-foreground">Celkem zaplaceno</span>
                    <p className="text-lg font-semibold text-foreground [font-variant-numeric:tabular-nums]">{formatCurrency(result.totalPaid)}</p>
                  </div>
                  <div>
                    <span className="text-sm text-muted-foreground">Celkem na úrocích</span>
                    <p className="text-lg font-semibold text-loss [font-variant-numeric:tabular-nums]">{formatCurrency(result.totalInterest)}</p>
                  </div>
                  <div>
                    <span className="text-sm text-muted-foreground">Poměr úrok/jistina</span>
                    <p className="text-lg font-semibold text-foreground">{formatPercent(interestRatio, 0)} / {formatPercent(principalRatio, 0)}</p>
                  </div>
                </div>
                <hr className="border-border" />
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <span className="text-sm text-muted-foreground">Měsíční cash flow</span>
                    <p className={`text-lg font-semibold [font-variant-numeric:tabular-nums] ${monthlyCashFlow >= 0 ? 'text-profit' : 'text-loss'}`}>{formatCurrency(monthlyCashFlow)}</p>
                  </div>
                  <div>
                    <span className="text-sm text-muted-foreground">Roční cash flow</span>
                    <p className={`text-lg font-semibold [font-variant-numeric:tabular-nums] ${annualCashFlow >= 0 ? 'text-profit' : 'text-loss'}`}>{formatCurrency(annualCashFlow)}</p>
                  </div>
                </div>
              </div>
            </ResultCard>

            <ExportButtons printRef={printRef} pdfData={pdfData} tabName="hypoteka" />

            <div className="calculator-card">
              <h3 className="text-lg font-semibold text-foreground mb-4">Amortizační graf</h3>
              <ResponsiveContainer width="100%" height={window.innerWidth < 1024 ? 300 : 400}>
                <AreaChart data={chartData}>
                  <XAxis dataKey="rok" label={{ value: 'Rok', position: 'insideBottom', offset: -5 }} />
                  <YAxis tickFormatter={(v) => `${(v / 1000000).toFixed(1)}M`} />
                  <Tooltip formatter={(value: number) => formatCurrency(value)} />
                  <Legend />
                  <Area type="monotone" dataKey="jistina" name="Jistina" stackId="1" fill="#3b82f6" stroke="#3b82f6" />
                  <Area type="monotone" dataKey="urok" name="Úrok" stackId="1" fill="#ef4444" stroke="#ef4444" />
                  <Area type="monotone" dataKey="zustatek" name="Zůstatek" fill="transparent" stroke="#6b7280" strokeDasharray="5 5" />
                </AreaChart>
              </ResponsiveContainer>
            </div>

            <div className="calculator-card">
              <button onClick={() => setShowTable(!showTable)} className="btn-primary text-sm">
                {showTable ? 'Skrýt amortizační tabulku' : 'Zobrazit amortizační tabulku'}
              </button>
              {showTable && (
                <div className="mt-4 overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="bg-muted sticky top-0">
                        <th className="px-3 py-2 text-left">Měsíc</th>
                        <th className="px-3 py-2 text-right">Splátka</th>
                        <th className="px-3 py-2 text-right">Jistina</th>
                        <th className="px-3 py-2 text-right">Úrok</th>
                        <th className="px-3 py-2 text-right">Zůstatek</th>
                      </tr>
                    </thead>
                    <tbody className="[font-variant-numeric:tabular-nums]">
                      {tableRows.truncated ? (
                        <>
                          {(tableRows as any).first.map((row: any) => (
                            <tr key={row.month} className={row.month % 2 === 0 ? 'bg-muted/50' : ''}>
                              <td className="px-3 py-1">{row.month}</td>
                              <td className="px-3 py-1 text-right">{formatCurrency(row.payment)}</td>
                              <td className="px-3 py-1 text-right">{formatCurrency(row.principal)}</td>
                              <td className="px-3 py-1 text-right">{formatCurrency(row.interest)}</td>
                              <td className="px-3 py-1 text-right">{formatCurrency(row.balance)}</td>
                            </tr>
                          ))}
                          <tr><td colSpan={5} className="text-center py-2 text-muted-foreground">...</td></tr>
                          {(tableRows as any).last.map((row: any) => (
                            <tr key={row.month} className={row.month % 2 === 0 ? 'bg-muted/50' : ''}>
                              <td className="px-3 py-1">{row.month}</td>
                              <td className="px-3 py-1 text-right">{formatCurrency(row.payment)}</td>
                              <td className="px-3 py-1 text-right">{formatCurrency(row.principal)}</td>
                              <td className="px-3 py-1 text-right">{formatCurrency(row.interest)}</td>
                              <td className="px-3 py-1 text-right">{formatCurrency(row.balance)}</td>
                            </tr>
                          ))}
                        </>
                      ) : (
                        (tableRows as any).rows?.map((row: any) => (
                          <tr key={row.month} className={row.month % 2 === 0 ? 'bg-muted/50' : ''}>
                            <td className="px-3 py-1">{row.month}</td>
                            <td className="px-3 py-1 text-right">{formatCurrency(row.payment)}</td>
                            <td className="px-3 py-1 text-right">{formatCurrency(row.principal)}</td>
                            <td className="px-3 py-1 text-right">{formatCurrency(row.interest)}</td>
                            <td className="px-3 py-1 text-right">{formatCurrency(row.balance)}</td>
                          </tr>
                        ))
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

export default MortgageCalculator;
