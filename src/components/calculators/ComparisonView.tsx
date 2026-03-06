import React, { useState, useMemo, useRef } from 'react';
import SliderInput from '@/components/ui/SliderInput';
import InputField from '@/components/ui/InputField';
import ResultCard from '@/components/ui/ResultCard';
import ExportButtons from '@/components/ui/ExportButtons';
import { MORTGAGE_DEFAULTS, COMPARISON_DEFAULTS } from '@/lib/constants';
import { calculateComparison } from '@/lib/calculations';
import { formatCurrency, formatPercent } from '@/lib/formatters';
import { LineChart, Line, XAxis, YAxis, Tooltip, Legend, ResponsiveContainer, ReferenceLine } from 'recharts';
import { Home, TrendingUp } from 'lucide-react';

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
    etfReturn,
    comparisonYears,
  ), [propertyPrice, downPayment, loanAmount, interestRate, loanTerm, monthlyRent, monthlyExpenses, annualAppreciation, vacancyRate, etfReturn, comparisonYears]);

  const pdfData = {
    title: 'Porovnání',
    inputs: {
      'Cena nemovitosti': formatCurrency(propertyPrice),
      'Vlastní zdroje': formatCurrency(downPayment),
      'Úroková sazba': formatPercent(interestRate),
      'Doba splácení': `${loanTerm} let`,
      'Měsíční nájem': formatCurrency(monthlyRent),
      'Měsíční náklady': formatCurrency(monthlyExpenses),
      'Roční zhodnocení': formatPercent(annualAppreciation),
      'Míra neobsazenosti': formatPercent(vacancyRate, 0),
      'Období porovnání': `${comparisonYears} let`,
      'Očekávaný výnos ETF': formatPercent(etfReturn),
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
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="calculator-card space-y-4">
          <h2 className="text-lg font-semibold text-foreground">Parametry porovnání</h2>
          <SliderInput label="Období porovnání" value={comparisonYears} onChange={setComparisonYears} min={1} max={40} step={1} unit="let" />
          <SliderInput label="Očekávaný roční výnos ETF" value={etfReturn} onChange={setEtfReturn} min={1} max={30} step={0.1} unit="%" />
          <hr className="border-border" />
          <h3 className="text-sm font-semibold text-foreground">Parametry nemovitosti</h3>
          <SliderInput label="Cena nemovitosti" value={propertyPrice} onChange={setPropertyPrice} min={500000} max={30000000} step={100000} unit="CZK" />
          <SliderInput label="Vlastní zdroje (akontace)" value={downPayment} onChange={(v) => setDownPayment(Math.min(v, propertyPrice))} min={0} max={propertyPrice} step={50000} unit="CZK" />
          <SliderInput label="Úroková sazba (% p.a.)" value={interestRate} onChange={setInterestRate} min={0.1} max={15} step={0.1} unit="%" />
          <SliderInput label="Doba splácení" value={loanTerm} onChange={setLoanTerm} min={1} max={40} step={1} unit="let" />
          <InputField label="Měsíční nájem (příjem)" value={monthlyRent} onChange={setMonthlyRent} min={0} max={500000} step={500} unit="CZK" />
          <InputField label="Měsíční náklady (správa, fond oprav)" value={monthlyExpenses} onChange={setMonthlyExpenses} min={0} max={200000} step={500} unit="CZK" />
          <SliderInput label="Roční zhodnocení nemovitosti" value={annualAppreciation} onChange={setAnnualAppreciation} min={-5} max={15} step={0.1} unit="%" />
          <SliderInput label="Míra neobsazenosti" value={vacancyRate} onChange={setVacancyRate} min={0} max={50} step={1} unit="%" />
        </div>

        <div className="space-y-6" ref={printRef}>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <ResultCard className={result.winner === 'mortgage' ? 'ring-2 ring-profit' : ''}>
              <div className="flex items-center gap-2 mb-3">
                <Home size={20} className="text-profit" />
                <h3 className="font-semibold text-foreground">Investice do nemovitosti</h3>
              </div>
              <div className="space-y-2 [font-variant-numeric:tabular-nums]">
                <Row label="Hodnota nemovitosti" value={formatCurrency(result.mortgage.propertyValue)} />
                <Row label="Zbývající dluh" value={formatCurrency(result.mortgage.remainingDebt)} className="text-loss" />
                <Row label="Kumulativní cash flow" value={formatCurrency(result.mortgage.cumulativeCashFlow)} className={result.mortgage.cumulativeCashFlow >= 0 ? 'text-profit' : 'text-loss'} />
                <hr className="border-border" />
                <div>
                  <span className="text-sm text-muted-foreground">Čisté jmění</span>
                  <p className="text-2xl font-bold text-foreground">{formatCurrency(result.mortgage.netWorth)}</p>
                </div>
                <Row label="ROI" value={formatPercent(result.mortgage.roi)} />
                <Row label="Roční ROI" value={formatPercent(result.mortgage.annualROI)} />
              </div>
            </ResultCard>

            <ResultCard className={result.winner === 'etf' ? 'ring-2 ring-primary-500' : ''}>
              <div className="flex items-center gap-2 mb-3">
                <TrendingUp size={20} className="text-primary-500" />
                <h3 className="font-semibold text-foreground">Investice do ETF</h3>
              </div>
              <div className="space-y-2 [font-variant-numeric:tabular-nums]">
                <Row label="Celková hodnota" value={formatCurrency(result.etf.totalValue)} />
                <Row label="Celkem investováno" value={formatCurrency(result.etf.totalInvested)} />
                <Row label="Výnosy" value={formatCurrency(result.etf.earnings)} className="text-profit" />
                <hr className="border-border" />
                <div>
                  <span className="text-sm text-muted-foreground">Čisté jmění</span>
                  <p className="text-2xl font-bold text-foreground">{formatCurrency(result.etf.totalValue)}</p>
                </div>
                <Row label="ROI" value={formatPercent(result.etf.roi)} />
                <Row label="Roční ROI" value={formatPercent(result.etf.annualROI)} />
              </div>
            </ResultCard>
          </div>

          {/* Winner banner */}
          <div className={`rounded-lg p-6 text-center ${
            result.winner === 'mortgage'
              ? 'bg-gradient-to-r from-primary-50 to-primary-100'
              : 'bg-gradient-to-r from-primary-50 to-blue-50'
          }`}>
            <div className="flex items-center justify-center gap-3 mb-2">
              {result.winner === 'mortgage' ? <Home size={28} className="text-profit" /> : <TrendingUp size={28} className="text-primary-500" />}
              <p className="text-xl font-bold text-foreground">
                {result.winner === 'mortgage'
                  ? `Nemovitost vyhrává o ${formatCurrency(Math.abs(result.difference))}!`
                  : `ETF vyhrává o ${formatCurrency(Math.abs(result.difference))}!`
                }
              </p>
            </div>
            <p className="text-sm text-muted-foreground">Rozdíl: {formatPercent(Math.abs(result.differencePercent))}</p>
          </div>

          <ExportButtons printRef={printRef} pdfData={pdfData} tabName="porovnani" />

          <div className="calculator-card">
            <h3 className="text-lg font-semibold text-foreground mb-4">Srovnání v čase</h3>
            <ResponsiveContainer width="100%" height={window.innerWidth < 1024 ? 350 : 450}>
              <LineChart data={timeline}>
                <XAxis dataKey="year" label={{ value: 'Rok', position: 'insideBottom', offset: -5 }} />
                <YAxis tickFormatter={(v) => `${(v / 1000000).toFixed(1)}M`} />
                <Tooltip formatter={(value: number) => formatCurrency(value)} />
                <Legend />
                <ReferenceLine y={downPayment} stroke="#6b7280" strokeDasharray="3 3" label="Počáteční investice" />
                <Line type="monotone" dataKey="mortgageNetWorth" name="Nemovitost (čisté jmění)" stroke="#10b981" strokeWidth={2} dot />
                <Line type="monotone" dataKey="etfValue" name="ETF (hodnota portfolia)" stroke="#3b82f6" strokeWidth={2} dot />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>
    </div>
  );
};

const Row: React.FC<{ label: string; value: string; className?: string }> = ({ label, value, className = 'text-foreground' }) => (
  <div className="flex justify-between">
    <span className="text-sm text-muted-foreground">{label}</span>
    <span className={`text-sm font-semibold ${className}`}>{value}</span>
  </div>
);

export default ComparisonView;
