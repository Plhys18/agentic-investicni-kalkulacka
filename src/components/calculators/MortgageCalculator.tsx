import React, { useMemo, useRef, useState } from 'react';
import SliderInput from '@/components/ui/SliderInput';
import ResultCard from '@/components/ui/ResultCard';
import ExportButtons from '@/components/ui/ExportButtons';
import { calculateMortgagePayment, calculateComparison } from '@/lib/calculations';
import { maxAmount } from '@/lib/constants';
import { formatCurrency } from '@/lib/formatters';
import { useCurrency } from '@/hooks/useCurrency';
import { useLanguage } from '@/hooks/useLanguage';
import { useCalculatorStore } from '@/hooks/useCalculatorStore';
import { AreaChart, Area, XAxis, YAxis, Tooltip, CartesianGrid, ResponsiveContainer } from 'recharts';
import { Bot, ChevronDown, ChevronUp } from 'lucide-react';
import type { AmortizationRow, TableRows } from '@/types';

const MortgageCalculator: React.FC = () => {
  const { currency } = useCurrency();
  const { lang, t } = useLanguage();
  const { mortgage, setMortgage } = useCalculatorStore();
  const [showTable, setShowTable] = useState(false);
  const printRef = useRef<HTMLDivElement>(null);

  const { propertyPrice, downPayment, interestRate, loanTerm, monthlyRent, monthlyExpenses, annualAppreciation, vacancyRate } = mortgage;
  
  const mortgageInputs = useMemo(() => ({
    ...mortgage,
    loanAmount: Math.max(0, propertyPrice - downPayment)
  }), [mortgage, propertyPrice, downPayment]);

  // Use calculateComparison to get the full picture (mortgage vs ETF/Rent)
  const { result: comparison, timeline } = useMemo(() => 
    calculateComparison(mortgageInputs, 8, loanTerm), // Default 8% market return for comparison
    [mortgageInputs, loanTerm]
  );

  const mortgageResult = useMemo(() => 
    calculateMortgagePayment(mortgageInputs),
    [mortgageInputs]
  );

  const wealthDifference = comparison.difference;

  const tableRows: TableRows = useMemo(() => {
    const s = mortgageResult.amortizationSchedule;
    if (s.length <= 120) return { rows: s, truncated: false };
    return { first: s.slice(0, 60), last: s.slice(-60), truncated: true };
  }, [mortgageResult]);

  const fc = (n: number) => formatCurrency(n, currency);

  const pdfData = {
    title: t('tab.mortgage'),
    inputs: {
      [t('mortgage.propertyPrice')]: fc(propertyPrice),
      [t('mortgage.downPayment')]: fc(downPayment),
      [t('mortgage.interestRate')]: `${interestRate}%`,
      [t('mortgage.loanTerm')]: `${loanTerm} ${t('common.years')}`,
    },
    results: {
      [t('mortgage.monthlyPayment')]: fc(mortgageResult.monthlyPayment),
      [t('mortgage.totalPaid')]: fc(mortgageResult.totalPaid),
      [t('mortgage.totalInterest')]: fc(mortgageResult.totalInterest),
    },
  };

  return (
    <div className="max-w-6xl mx-auto space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-1000" ref={printRef}>
      <div className="flex flex-col lg:flex-row gap-8">
        {/* Inputs */}
        <div className="lg:w-1/3 space-y-8 no-print">
          <div className="calculator-card">
            <h3 className="section-title">{t('mortgage.inputs')}</h3>
            <div className="space-y-10">
              <SliderInput
                label={t('mortgage.propertyPrice')}
                value={propertyPrice}
                onChange={(v) => setMortgage({ propertyPrice: v })}
                min={1000000}
                max={maxAmount(currency)}
                step={100000}
                unit={currency}
              />
              <SliderInput
                label={t('mortgage.downPayment')}
                value={downPayment}
                onChange={(v) => setMortgage({ downPayment: Math.min(v, propertyPrice) })}
                min={0}
                max={propertyPrice}
                step={50000}
                unit={currency}
              />
              <SliderInput
                label={t('mortgage.loanTerm')}
                value={loanTerm}
                onChange={(v) => setMortgage({ loanTerm: v })}
                min={5}
                max={40}
                step={1}
                unit={lang === 'cs' ? 'let' : 'yrs'}
              />
              <SliderInput
                label={t('mortgage.interestRate')}
                value={interestRate}
                onChange={(v) => setMortgage({ interestRate: v })}
                min={1}
                max={15}
                step={0.1}
                unit="%"
              />
            </div>
          </div>

          <div className="calculator-card">
            <h3 className="section-title">Investiční parametry</h3>
            <div className="space-y-10">
              <SliderInput
                label={t('mortgage.appreciation')}
                value={annualAppreciation}
                onChange={(v) => setMortgage({ annualAppreciation: v })}
                min={0}
                max={10}
                step={0.5}
                unit="%"
              />
              <SliderInput
                label={t('mortgage.vacancy')}
                value={vacancyRate}
                onChange={(v) => setMortgage({ vacancyRate: v })}
                min={0}
                max={20}
                step={1}
                unit="%"
              />
            </div>
          </div>
        </div>

        {/* Results */}
        <div className="lg:w-2/3 space-y-8">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <ResultCard className="border-primary/40 bg-primary/5">
              <div className="space-y-1">
                <p className="text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground/60">
                  {t('mortgage.monthlyPayment')}
                </p>
                <div className="flex items-baseline gap-2">
                  <span className="text-4xl font-black stat-value text-foreground">
                    {fc(mortgageResult.monthlyPayment)}
                  </span>
                  <span className="text-xs font-bold text-muted-foreground/50 uppercase tracking-widest">
                    / {lang === 'cs' ? 'měsíc' : 'month'}
                  </span>
                </div>
              </div>
            </ResultCard>

            <ResultCard className="border-border bg-secondary/20">
              <div className="space-y-1">
                <p className="text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground/60">
                  {t('mortgage.totalInterest')}
                </p>
                <div className="flex items-baseline gap-2">
                  <span className="text-3xl font-black stat-value text-foreground/80">
                    {fc(mortgageResult.totalInterest)}
                  </span>
                </div>
              </div>
            </ResultCard>
          </div>

          <div className="calculator-card overflow-visible">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between mb-8 gap-4">
              <h3 className="section-title mb-0">{t('mortgage.comparison.title')}</h3>
              <div className="flex items-center gap-4">
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 rounded-full bg-primary" />
                  <span className="text-[10px] font-black uppercase tracking-widest text-muted-foreground/60">
                    Majetek v nemovitosti
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 rounded-full bg-muted-foreground/30" />
                  <span className="text-[10px] font-black uppercase tracking-widest text-muted-foreground/60">
                    Akciové portfolio
                  </span>
                </div>
              </div>
            </div>
            
            <div className="h-[400px] w-full mt-4">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={timeline} margin={{ top: 10, right: 10, left: 20, bottom: 0 }}>
                  <defs>
                    <linearGradient id="colorEquity" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="hsl(var(--primary))" stopOpacity={0.3}/>
                      <stop offset="95%" stopColor="hsl(var(--primary))" stopOpacity={0}/>
                    </linearGradient>
                    <linearGradient id="colorMarket" x1="0" y1="0" x2="0" y2="1">
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
                              Rok {payload[0].payload.year}
                            </p>
                            <div className="space-y-1.5">
                              <div className="flex items-center justify-between gap-8">
                                <span className="text-xs font-bold text-foreground/70">Vlastní kapitál</span>
                                <span className="text-xs font-black stat-value text-primary">
                                  {fc(payload[0].value as number)}
                                </span>
                              </div>
                              <div className="flex items-center justify-between gap-8">
                                <span className="text-xs font-bold text-foreground/70">Finanční majetek</span>
                                <span className="text-xs font-black stat-value text-muted-foreground">
                                  {fc(payload[1].value as number)}
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
                    dataKey="mortgageNetWorth"
                    stroke="hsl(var(--primary))"
                    strokeWidth={4}
                    fillOpacity={1}
                    fill="url(#colorEquity)"
                  />
                  <Area
                    type="monotone"
                    dataKey="etfValue"
                    stroke="hsl(var(--muted-foreground))"
                    strokeWidth={2}
                    strokeDasharray="5 5"
                    fillOpacity={1}
                    fill="url(#colorMarket)"
                  />
                </AreaChart>
              </ResponsiveContainer>
            </div>
            
            <div className="mt-8 p-6 rounded-2xl bg-secondary/30 border border-glass-border no-print">
              <div className="flex items-start gap-4">
                <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center shrink-0">
                  <Bot size={20} className="text-primary" />
                </div>
                <div className="space-y-1">
                  <p className="text-xs font-bold text-foreground leading-snug">
                    {wealthDifference > 0 
                      ? (lang === 'cs' ? 'Hypotéka tvoří v tomto horizontu vyšší čisté jmění.' : 'Mortgage builds higher net worth in this timeframe.')
                      : (lang === 'cs' ? 'Nájem s investováním tvoří vyšší čisté jmění.' : 'Rent with investing builds higher net worth.')
                    }
                  </p>
                  <p className="text-[11px] text-muted-foreground/70">
                    {lang === 'cs' 
                      ? `Rozdíl v majetku po ${loanTerm} letech činí ${fc(Math.abs(wealthDifference))}.`
                      : `The difference in wealth after ${loanTerm} years is ${fc(Math.abs(wealthDifference))}.`
                    }
                  </p>
                </div>
              </div>
            </div>

            <div className="mt-6 flex flex-wrap gap-3 no-print">
              <ExportButtons printRef={printRef} pdfData={pdfData} tabName="hypoteka" />
              <button 
                onClick={() => setShowTable(!showTable)} 
                className="btn-secondary flex items-center gap-2"
              >
                {showTable ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
                {showTable ? t('mortgage.hideTable') : t('mortgage.showTable')}
              </button>
            </div>

            {showTable && (
              <div className="mt-8 overflow-x-auto rounded-3xl border border-glass-border bg-card/50 overflow-hidden no-print animate-in fade-in slide-in-from-top-4 duration-500">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="bg-muted/30">
                      {[t('mortgage.month'), t('mortgage.payment'), t('mortgage.principal'), t('mortgage.interest'), t('mortgage.balance')].map((h, i) => (
                        <th key={h} className={`px-4 py-4 text-[10px] font-black uppercase tracking-wider text-muted-foreground/60 ${i === 0 ? 'text-left' : 'text-right'}`}>{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody className="stat-value text-[11px]">
                    {tableRows.truncated ? (
                      <>
                        {tableRows.first.map((row) => <TableRow key={row.month} row={row} fc={fc} />)}
                        <tr><td colSpan={5} className="text-center py-4 text-muted-foreground/40 font-sans italic tracking-widest text-[10px]">TRANCHE TRUNCATED ...</td></tr>
                        {tableRows.last.map((row) => <TableRow key={row.month} row={row} fc={fc} />)}
                      </>
                    ) : (
                      (tableRows as { truncated: false; rows: AmortizationRow[] }).rows.map((row) => <TableRow key={row.month} row={row} fc={fc} />)
                    )}
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

const TableRow: React.FC<{ row: AmortizationRow; fc: (n: number) => string }> = ({ row, fc }) => (
  <tr className="border-t border-glass-border hover:bg-primary/5 transition-colors group">
    <td className="px-4 py-2.5 font-black text-muted-foreground/40 group-hover:text-primary transition-colors">{row.month}</td>
    <td className="px-4 py-2.5 text-right font-bold">{fc(row.payment)}</td>
    <td className="px-4 py-2.5 text-right font-medium text-profit">{fc(row.principal)}</td>
    <td className="px-4 py-2.5 text-right font-medium text-loss">{fc(row.interest)}</td>
    <td className="px-4 py-2.5 text-right font-black text-foreground/80">{fc(row.balance)}</td>
  </tr>
);

export default MortgageCalculator;
