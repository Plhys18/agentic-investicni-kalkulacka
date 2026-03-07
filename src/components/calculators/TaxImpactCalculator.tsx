import React, { useMemo, useRef } from 'react';
import SliderInput from '@/components/ui/SliderInput';
import ResultCard from '@/components/ui/ResultCard';
import ExportButtons from '@/components/ui/ExportButtons';
import { calculateCompoundInterest } from '@/lib/calculations';
import { maxAmount } from '@/lib/constants';
import { formatCurrency, formatPercent, formatNumber } from '@/lib/formatters';
import { useCurrency } from '@/hooks/useCurrency';
import { useLanguage } from '@/hooks/useLanguage';
import { useCalculatorStore } from '@/hooks/useCalculatorStore';
import { BarChart, Bar, XAxis, YAxis, Tooltip, Legend, ResponsiveContainer, Cell } from 'recharts';
import { Receipt, Building2, TrendingUp, Bitcoin } from 'lucide-react';

interface TaxScenario {
  id: string;
  icon: React.ReactNode;
  color: string;
  grossReturn: number;
  taxRate: number;
  netReturn: number;
  grossValue: number;
  netValue: number;
  taxPaid: number;
}

const TaxImpactCalculator: React.FC = () => {
  const { currency } = useCurrency();
  const { t } = useLanguage();
  const fc = (n: number) => formatCurrency(n, currency);
  const { tax, setTax } = useCalculatorStore();
  const printRef = useRef<HTMLDivElement>(null);

  const { investmentAmount, investmentYears, etfGrossReturn, realEstateGrossReturn, cryptoGrossReturn, etfTaxRate, realEstateTaxRate, cryptoTaxRate } = tax;

  const scenarios = useMemo((): TaxScenario[] => {
    const calculate = (
      id: string,
      icon: React.ReactNode,
      color: string,
      grossReturn: number,
      taxRate: number,
      exemptionYears: number, // 0 = no exemption
    ) => {
      const grossCalc = calculateCompoundInterest(investmentAmount, 0, grossReturn, investmentYears);
      const grossEarnings = grossCalc.finalValue - investmentAmount;
      // Czech tax law: gains are exempt if held longer than the exemption period
      const effectiveTaxRate = (exemptionYears > 0 && investmentYears >= exemptionYears)
        ? 0
        : taxRate;
      const taxPaid = grossEarnings * (effectiveTaxRate / 100);
      const netValue = grossCalc.finalValue - taxPaid;
      const netReturn = investmentAmount > 0 ? (Math.pow(netValue / investmentAmount, 1 / investmentYears) - 1) * 100 : 0;

      return {
        id,
        icon,
        color,
        grossReturn,
        taxRate,
        netReturn,
        grossValue: grossCalc.finalValue,
        netValue,
        taxPaid,
      };
    };

    return [
      calculate('etf', <TrendingUp size={18} />, 'hsl(var(--primary))', etfGrossReturn, etfTaxRate, 3),
      calculate('realEstate', <Building2 size={18} />, '#10B981', realEstateGrossReturn, realEstateTaxRate, 10),
      calculate('crypto', <Bitcoin size={18} />, '#F7931A', cryptoGrossReturn, cryptoTaxRate, 3),
    ];
  }, [investmentAmount, investmentYears, etfGrossReturn, realEstateGrossReturn, cryptoGrossReturn, etfTaxRate, realEstateTaxRate, cryptoTaxRate]);

  const barData = useMemo(() => {
    return scenarios.map((s) => ({
      name: t(`tax.${s.id}`),
      gross: s.grossValue,
      net: s.netValue,
      tax: s.taxPaid,
      color: s.color,
    }));
  }, [scenarios, t]);

  const pdfData = {
    title: t('tax.title'),
    inputs: {
      [t('tax.investmentAmount')]: fc(investmentAmount),
      [t('tax.investmentYears')]: `${investmentYears} ${t('common.years')}`,
    },
    results: Object.fromEntries(scenarios.map((s) => [
      t(`tax.${s.id}`),
      `${fc(s.netValue)} (${t('tax.taxLabel')}: ${fc(s.taxPaid)})`,
    ])),
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-[minmax(0,420px)_1fr] gap-6">
      <div className="calculator-card space-y-5">
        <div className="flex items-center gap-2.5 mb-1">
          <div className="w-8 h-8 rounded-lg bg-red-500/10 flex items-center justify-center">
            <Receipt size={18} className="text-red-500" />
          </div>
          <p className="section-title">{t('tax.title')}</p>
        </div>

        <div className="space-y-4">
          <SliderInput label={t('tax.investmentAmount')} value={investmentAmount} onChange={(v) => setTax({ investmentAmount: v })} min={0} max={maxAmount(currency)} step={100000} unit={currency} />
          <SliderInput label={t('tax.investmentYears')} value={investmentYears} onChange={(v) => setTax({ investmentYears: v })} min={1} max={30} step={1} unit={t('common.years')} />
        </div>

        <div className="border-t border-border/50 pt-4 space-y-4">
          <p className="section-title">{t('tax.etf')} (ETF / {t('tax.stocks')})</p>
          <SliderInput label={t('tax.grossReturnRate')} value={etfGrossReturn} onChange={(v) => setTax({ etfGrossReturn: v })} min={1} max={30} step={0.5} unit="%" />
          <SliderInput label={t('tax.taxRate')} value={etfTaxRate} onChange={(v) => setTax({ etfTaxRate: v })} min={0} max={50} step={1} unit="%" />
          <p className="text-[10px] text-muted-foreground">{t('tax.etfTaxNote')}</p>
        </div>

        <div className="border-t border-border/50 pt-4 space-y-4">
          <p className="section-title">{t('tax.realEstate')}</p>
          <SliderInput label={t('tax.grossReturnRate')} value={realEstateGrossReturn} onChange={(v) => setTax({ realEstateGrossReturn: v })} min={1} max={20} step={0.5} unit="%" />
          <SliderInput label={t('tax.taxRate')} value={realEstateTaxRate} onChange={(v) => setTax({ realEstateTaxRate: v })} min={0} max={50} step={1} unit="%" />
          <p className="text-[10px] text-muted-foreground">{t('tax.realEstateTaxNote')}</p>
        </div>

        <div className="border-t border-border/50 pt-4 space-y-4">
          <p className="section-title">{t('tax.crypto')}</p>
          <SliderInput label={t('tax.grossReturnRate')} value={cryptoGrossReturn} onChange={(v) => setTax({ cryptoGrossReturn: v })} min={1} max={100} step={1} unit="%" />
          <SliderInput label={t('tax.taxRate')} value={cryptoTaxRate} onChange={(v) => setTax({ cryptoTaxRate: v })} min={0} max={50} step={1} unit="%" />
          <p className="text-[10px] text-muted-foreground">{t('tax.cryptoTaxNote')}</p>
        </div>
      </div>

      <div className="space-y-6" ref={printRef}>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {scenarios.map((s) => (
            <ResultCard key={s.id}>
              <div className="flex items-center gap-2.5 mb-3">
                <div className="w-8 h-8 rounded-lg flex items-center justify-center shrink-0" style={{ backgroundColor: `${s.color}20` }}>
                  <span style={{ color: s.color }}>{s.icon}</span>
                </div>
                <h3 className="font-bold text-foreground text-sm">{t(`tax.${s.id}`)}</h3>
              </div>
              <div className="space-y-2 overflow-hidden">
                <div className="min-w-0" title={fc(s.netValue)}>
                  <p className="text-xs text-muted-foreground">{t('tax.afterTaxValue')}</p>
                  <p className="text-lg md:text-xl font-black stat-value truncate" style={{ color: s.color }}>{fc(s.netValue)}</p>
                </div>
                <div className="grid grid-cols-2 gap-2">
                  <div className="min-w-0" title={fc(s.taxPaid)}>
                    <p className="text-[10px] text-muted-foreground">{t('tax.taxPaid')}</p>
                    <p className="text-xs md:text-sm font-bold text-red-500 stat-value truncate">{fc(s.taxPaid)}</p>
                  </div>
                  <div className="min-w-0" title={formatPercent(s.netReturn)}>
                    <p className="text-[10px] text-muted-foreground">{t('tax.netReturn')}</p>
                    <p className="text-xs md:text-sm font-bold text-profit stat-value truncate">{formatPercent(s.netReturn)}</p>
                  </div>
                </div>
              </div>
            </ResultCard>
          ))}
        </div>


        <div className="calculator-card">
          <h3 className="section-title mb-4">{t('tax.grossVsNet')}</h3>
          <div className="h-[350px]">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={barData} barCategoryGap="20%">
                <XAxis dataKey="name" tick={{ fontSize: 13, fontWeight: 600, fill: 'hsl(var(--foreground))' }} />
                <YAxis tickFormatter={(v) => `${(v / 1000000).toFixed(1)}M`} tick={{ fontSize: 12, fill: 'hsl(var(--muted-foreground))' }} />
                <Tooltip
                  formatter={(value: number) => fc(value)}
                  contentStyle={{ borderRadius: 12, border: 'none', boxShadow: '0 4px 20px rgba(0,0,0,0.15)', fontFamily: 'JetBrains Mono, monospace', fontSize: 13, backgroundColor: 'hsl(var(--card))', color: 'hsl(var(--foreground))' }}
                />
                <Legend />
                <Bar dataKey="net" name={t('tax.afterTaxValue')} radius={[8, 8, 0, 0]}>
                  {barData.map((d, i) => <Cell key={i} fill={d.color} fillOpacity={0.85} />)}
                </Bar>
                <Bar dataKey="tax" name={t('tax.taxPaid')} fill="#EF4444" fillOpacity={0.6} radius={[8, 8, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        <ExportButtons printRef={printRef} pdfData={pdfData} tabName="tax" />
      </div>
    </div>
  );
};

export default TaxImpactCalculator;
