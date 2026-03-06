import React, { useState, useMemo, useRef } from 'react';
import SliderInput from '@/components/ui/SliderInput';
import InputField from '@/components/ui/InputField';
import ResultCard from '@/components/ui/ResultCard';
import ExportButtons from '@/components/ui/ExportButtons';
import { MORTGAGE_DEFAULTS, COMPARISON_DEFAULTS } from '@/lib/constants';
import { calculateComparison } from '@/lib/calculations';
import { formatCurrency, formatPercent } from '@/lib/formatters';
import { LineChart, Line, XAxis, YAxis, Tooltip, Legend, ResponsiveContainer, ReferenceLine } from 'recharts';
import { Home, TrendingUp, Trophy } from 'lucide-react';

const ComparisonView: React.FC = () => {
  const [propertyPrice, setPropertyPrice] = useState(MORTGAGE_DEFAULTS.propertyPrice);
  const [downPayment, setDownPayment] = useState(MORTGAGE_DEFAULTS.downPayment);
  const [interestRate, setInterestRate] = useState(MORTGAGE_DEFAULTS.interestRate);
  const [loanTerm, setLoanTerm] = useState(MORTGAGE_DEFAULTS.loanTerm);
  const [monthlyRent, setMonthlyRent] = useState(MORTGAGE_DEFAULTS.monthlyRent);
  const [monthlyExpenses, setMonthlyExpenses] = useState(MORTGAGE_DEFAULTS.monthlyExpenses);
  const [annualAppreciation, setAnnualAppreciation] = useState(MORTGAGE_DEFAULTS.annualAppreciation);
  const [vacancyRate, setVacancyRate] = useState(MORTGAGE_DEFAULTS.vacancyRate);
  const [comparisonYears, setComparisonYears] = useState(COMPARISON_DEFAULTS.comparisonYears);
  const [etfReturn, setEtfReturn] = useState(COMPARISON_DEFAULTS.etfReturn);
  const printRef = useRef<HTMLDivElement>(null);

  const loanAmount = Math.max(0, propertyPrice - downPayment);

  const { result, timeline } = useMemo(() => calculateComparison(
    { propertyPrice, downPayment, loanAmount, interestRate, loanTerm, monthlyRent, monthlyExpenses, annualAppreciation, vacancyRate },
    etfReturn, comparisonYears,
  ), [propertyPrice, downPayment, loanAmount, interestRate, loanTerm, monthlyRent, monthlyExpenses, annualAppreciation, vacancyRate, etfReturn, comparisonYears]);

  const pdfData = {
    title: 'Porovnání',
    inputs: {
      'Cena nemovitosti': formatCurrency(propertyPrice),
      'Vlastní zdroje': formatCurrency(downPayment),
      'Období porovnání': `${comparisonYears} let`,
      'Výnos ETF': formatPercent(etfReturn),
    },
    results: {
      'Nemovitost - čisté jmění': formatCurrency(result.mortgage.netWorth),
      'ETF - celková hodnota': formatCurrency(result.etf.totalValue),
      'Vítěz': result.winner === 'mortgage' ? 'Nemovitost' : 'ETF',
      'Rozdíl': formatCurrency(Math.abs(result.difference)),
    },
  };

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 lg:grid-cols-[minmax(0,420px)_1fr] gap-6">
        <div className="calculator-card space-y-5">
          <p className="section-title mb-2">Parametry porovnání</p>
          <div className="space-y-4">
            <SliderInput label="Období porovnání" value={comparisonYears} onChange={setComparisonYears} min={1} max={40} step={1} unit="let" />
            <SliderInput label="Očekávaný roční výnos ETF" value={etfReturn} onChange={setEtfReturn} min={1} max={30} step={0.1} unit="%" />
          </div>

          <div className="border-t border-border/50 pt-4">
            <p className="section-title mb-4">Parametry nemovitosti</p>
            <div className="space-y-4">
              <SliderInput label="Cena nemovitosti" value={propertyPrice} onChange={setPropertyPrice} min={500000} max={30000000} step={100000} unit="CZK" />
              <SliderInput label="Vlastní zdroje (akontace)" value={downPayment} onChange={(v) => setDownPayment(Math.min(v, propertyPrice))} min={0} max={propertyPrice} step={50000} unit="CZK" />
              <SliderInput label="Úroková sazba (% p.a.)" value={interestRate} onChange={setInterestRate} min={0.1} max={15} step={0.1} unit="%" />
              <SliderInput label="Doba splácení" value={loanTerm} onChange={setLoanTerm} min={1} max={40} step={1} unit="let" />
              <InputField label="Měsíční nájem (příjem)" value={monthlyRent} onChange={setMonthlyRent} min={0} max={500000} step={500} unit="CZK" />
              <InputField label="Měsíční náklady" value={monthlyExpenses} onChange={setMonthlyExpenses} min={0} max={200000} step={500} unit="CZK" />
              <SliderInput label="Roční zhodnocení" value={annualAppreciation} onChange={setAnnualAppreciation} min={-5} max={15} step={0.1} unit="%" />
              <SliderInput label="Míra neobsazenosti" value={vacancyRate} onChange={setVacancyRate} min={0} max={50} step={1} unit="%" />
            </div>
          </div>
        </div>

        <div className="space-y-6" ref={printRef}>
          {/* Winner banner */}
          <div className={`rounded-xl p-5 border shadow-sm flex items-center gap-4 ${
            result.winner === 'mortgage'
              ? 'bg-gradient-to-r from-[hsl(160,84%,39%,0.08)] to-[hsl(160,84%,39%,0.02)] border-profit/20'
              : 'bg-gradient-to-r from-[hsl(217,91%,60%,0.08)] to-[hsl(217,91%,60%,0.02)] border-primary/20'
          }`}>
            <div className={`w-12 h-12 rounded-full flex items-center justify-center shrink-0 ${
              result.winner === 'mortgage' ? 'bg-profit/10' : 'bg-primary/10'
            }`}>
              <Trophy size={22} className={result.winner === 'mortgage' ? 'text-profit' : 'text-primary'} />
            </div>
            <div>
              <p className="font-bold text-foreground text-lg">
                {result.winner === 'mortgage'
                  ? `Nemovitost vyhrává o ${formatCurrency(Math.abs(result.difference))}!`
                  : `ETF vyhrává o ${formatCurrency(Math.abs(result.difference))}!`}
              </p>
              <p className="text-sm text-muted-foreground">Rozdíl: {formatPercent(Math.abs(result.differencePercent))}</p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <ResultCard className={result.winner === 'mortgage' ? 'ring-2 ring-profit/50 ring-offset-2 ring-offset-background' : ''}>
              <div className="flex items-center gap-2.5 mb-4">
                <div className="w-8 h-8 rounded-lg bg-profit/10 flex items-center justify-center">
                  <Home size={16} className="text-profit" />
                </div>
                <h3 className="font-semibold text-foreground text-sm">Investice do nemovitosti</h3>
              </div>
              <div className="space-y-2.5 stat-value text-sm">
                <Row label="Hodnota nemovitosti" value={formatCurrency(result.mortgage.propertyValue)} />
                <Row label="Zbývající dluh" value={formatCurrency(result.mortgage.remainingDebt)} className="text-loss" />
                <Row label="Kumulativní cash flow" value={formatCurrency(result.mortgage.cumulativeCashFlow)} className={result.mortgage.cumulativeCashFlow >= 0 ? 'text-profit' : 'text-loss'} />
                <div className="border-t border-border/30 pt-2.5">
                  <p className="text-xs text-muted-foreground font-sans">Čisté jmění</p>
                  <p className="text-2xl font-extrabold text-foreground">{formatCurrency(result.mortgage.netWorth)}</p>
                </div>
                <Row label="ROI" value={formatPercent(result.mortgage.roi)} />
                <Row label="Roční ROI" value={formatPercent(result.mortgage.annualROI)} />
              </div>
            </ResultCard>

            <ResultCard className={result.winner === 'etf' ? 'ring-2 ring-primary/50 ring-offset-2 ring-offset-background' : ''}>
              <div className="flex items-center gap-2.5 mb-4">
                <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center">
                  <TrendingUp size={16} className="text-primary" />
                </div>
                <h3 className="font-semibold text-foreground text-sm">Investice do ETF</h3>
              </div>
              <div className="space-y-2.5 stat-value text-sm">
                <Row label="Celková hodnota" value={formatCurrency(result.etf.totalValue)} />
                <Row label="Celkem investováno" value={formatCurrency(result.etf.totalInvested)} />
                <Row label="Výnosy" value={formatCurrency(result.etf.earnings)} className="text-profit" />
                <div className="border-t border-border/30 pt-2.5">
                  <p className="text-xs text-muted-foreground font-sans">Čisté jmění</p>
                  <p className="text-2xl font-extrabold text-foreground">{formatCurrency(result.etf.totalValue)}</p>
                </div>
                <Row label="ROI" value={formatPercent(result.etf.roi)} />
                <Row label="Roční ROI" value={formatPercent(result.etf.annualROI)} />
              </div>
            </ResultCard>
          </div>

          <ExportButtons printRef={printRef} pdfData={pdfData} tabName="porovnani" />

          <div className="calculator-card">
            <h3 className="section-title mb-4">Srovnání v čase</h3>
            <div className="h-[350px] lg:h-[450px]">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={timeline}>
                  <XAxis dataKey="year" tick={{ fontSize: 12 }} />
                  <YAxis tickFormatter={(v) => `${(v / 1000000).toFixed(1)}M`} tick={{ fontSize: 12 }} />
                  <Tooltip formatter={(value: number) => formatCurrency(value)} contentStyle={{ borderRadius: 12, border: 'none', boxShadow: '0 4px 20px rgba(0,0,0,0.1)' }} />
                  <Legend />
                  <ReferenceLine y={downPayment} stroke="#6b7280" strokeDasharray="3 3" />
                  <Line type="monotone" dataKey="mortgageNetWorth" name="Nemovitost (čisté jmění)" stroke="#10b981" strokeWidth={2.5} dot={{ r: 3 }} />
                  <Line type="monotone" dataKey="etfValue" name="ETF (hodnota portfolia)" stroke="#3b82f6" strokeWidth={2.5} dot={{ r: 3 }} />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

const Row: React.FC<{ label: string; value: string; className?: string }> = ({ label, value, className = 'text-foreground' }) => (
  <div className="flex justify-between items-center">
    <span className="text-muted-foreground font-sans text-xs">{label}</span>
    <span className={`font-semibold ${className}`}>{value}</span>
  </div>
);

export default ComparisonView;
