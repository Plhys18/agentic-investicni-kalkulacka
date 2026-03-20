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
import { BarChart, Bar, XAxis, YAxis, Tooltip, Legend, ResponsiveContainer, Cell, CartesianGrid } from 'recharts';
import { Receipt, Building2, TrendingUp, Bitcoin, Info } from 'lucide-react';
import { Tooltip as UITooltip, TooltipTrigger, TooltipContent, TooltipProvider } from '@/components/ui/tooltip';

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

const exemptionInfo: Record<string, string> = {
  etf: '§ 4 odst. 1 písm. w) ZDP — osvobození od daně z příjmů platí od 1. ledna 2025 pro cenné papíry (ETF, akcie) držené déle než 3 roky.',
  crypto: '§ 4 odst. 1 písm. ze) ZDP — osvobození od daně z příjmů platí od 1. ledna 2025 pro kryptoaktiva držená déle než 3 roky.',
  realEstate: '§ 4 odst. 1 písm. b) ZDP — příjem z prodeje nemovitosti je osvobozen od daně po 10 letech držení.',
};

const TaxImpactCalculator: React.FC = () => {
  const { currency } = useCurrency();
  const { lang, t } = useLanguage();
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
      calculate('etf', <TrendingUp size={20} />, 'hsl(var(--primary))', etfGrossReturn, etfTaxRate, 3),
      calculate('realEstate', <Building2 size={20} />, '#10B981', realEstateGrossReturn, realEstateTaxRate, 10),
      calculate('crypto', <Bitcoin size={20} />, '#F7931A', cryptoGrossReturn, cryptoTaxRate, 3),
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
    <div className="max-w-6xl mx-auto space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-1000" ref={printRef}>
      <div className="flex flex-col lg:flex-row gap-8">
        {/* Sidebar Inputs */}
        <div className="lg:w-1/3 space-y-8 no-print">
          <div className="calculator-card">
            <div className="flex items-center gap-3 mb-6">
              <div className="w-10 h-10 rounded-xl bg-red-500/10 flex items-center justify-center border border-red-500/20">
                <Receipt size={20} className="text-red-500" />
              </div>
              <h3 className="section-title mb-0">{t('tax.title')}</h3>
            </div>

            <div className="space-y-10">
              <SliderInput label={t('tax.investmentAmount')} value={investmentAmount} onChange={(v) => setTax({ investmentAmount: v })} min={0} max={maxAmount(currency)} step={100000} unit={currency} />
              <SliderInput label={t('tax.investmentYears')} value={investmentYears} onChange={(v) => setTax({ investmentYears: v })} min={1} max={30} step={1} unit={t('common.years')} />
            </div>

            <div className="mt-10 pt-10 border-t border-glass-border space-y-10">
              <div className="space-y-8">
                <div className="space-y-1">
                  <p className="text-[11px] font-black uppercase tracking-widest text-primary/80">{t('tax.etf')} (ETF / {t('tax.stocks')})</p>
                  <SliderInput label={t('tax.grossReturnRate')} value={etfGrossReturn} onChange={(v) => setTax({ etfGrossReturn: v })} min={1} max={30} step={0.5} unit="%" />
                  <SliderInput label={t('tax.taxRate')} value={etfTaxRate} onChange={(v) => setTax({ etfTaxRate: v })} min={0} max={50} step={1} unit="%" />
                  <p className="text-[10px] text-muted-foreground/60 italic mt-1">{t('tax.etfTaxNote')}</p>
                </div>

                <div className="space-y-1 border-t border-glass-border/30 pt-8">
                  <p className="text-[11px] font-black uppercase tracking-widest text-profit/80">{t('tax.realEstate')}</p>
                  <SliderInput label={t('tax.grossReturnRate')} value={realEstateGrossReturn} onChange={(v) => setTax({ realEstateGrossReturn: v })} min={1} max={20} step={0.5} unit="%" />
                  <SliderInput label={t('tax.taxRate')} value={realEstateTaxRate} onChange={(v) => setTax({ realEstateTaxRate: v })} min={0} max={50} step={1} unit="%" />
                  <p className="text-[10px] text-muted-foreground/60 italic mt-1">{t('tax.realEstateTaxNote')}</p>
                </div>

                <div className="space-y-1 border-t border-glass-border/30 pt-8">
                  <p className="text-[11px] font-black uppercase tracking-widest text-orange-500/80">{t('tax.crypto')}</p>
                  <SliderInput label={t('tax.grossReturnRate')} value={cryptoGrossReturn} onChange={(v) => setTax({ cryptoGrossReturn: v })} min={1} max={100} step={1} unit="%" />
                  <SliderInput label={t('tax.taxRate')} value={cryptoTaxRate} onChange={(v) => setTax({ cryptoTaxRate: v })} min={0} max={50} step={1} unit="%" />
                  <p className="text-[10px] text-muted-foreground/60 italic mt-1">{t('tax.cryptoTaxNote')}</p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Results Area */}
        <div className="lg:w-2/3 space-y-8">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {scenarios.map((s) => (
              <ResultCard key={s.id} className="group hover:scale-[1.02] transition-transform duration-500">
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-10 h-10 rounded-xl flex items-center justify-center bg-card shadow-sm border border-glass-border" style={{ color: s.color }}>
                    {s.icon}
                  </div>
                  <h3 className="text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground/60">{t(`tax.${s.id}`)}</h3>
                </div>
                <div className="space-y-4">
                  <div className="min-w-0">
                    <p className="text-[9px] font-black uppercase tracking-widest text-muted-foreground/40 mb-1">{t('tax.afterTaxValue')}</p>
                    <p className="text-2xl font-black stat-value truncate" style={{ color: s.color }}>{fc(s.netValue)}</p>
                  </div>
                  <div className="grid grid-cols-2 gap-4 pt-4 border-t border-glass-border/30">
                    <div>
                      <p className="text-[9px] font-black uppercase tracking-widest text-muted-foreground/40 mb-1 flex items-center gap-1">
                        {t('tax.taxPaid')}
                        {s.taxPaid === 0 && (
                          <TooltipProvider delayDuration={200}>
                            <UITooltip>
                              <TooltipTrigger asChild>
                                <Info size={10} className="text-profit cursor-help" />
                              </TooltipTrigger>
                              <TooltipContent className="max-w-[200px] text-[10px] leading-tight glass-card p-3 rounded-xl border-glass-border">
                                {exemptionInfo[s.id]}
                              </TooltipContent>
                            </UITooltip>
                          </TooltipProvider>
                        )}
                      </p>
                      <p className={`text-xs font-bold stat-value truncate ${s.taxPaid > 0 ? 'text-red-500' : 'text-profit'}`}>{fc(s.taxPaid)}</p>
                    </div>
                    <div>
                      <p className="text-[9px] font-black uppercase tracking-widest text-muted-foreground/40 mb-1">{t('tax.netReturn')}</p>
                      <p className="text-xs font-bold text-foreground stat-value truncate text-profit">{formatPercent(s.netReturn)}</p>
                    </div>
                  </div>
                </div>
              </ResultCard>
            ))}
          </div>

          <div className="calculator-card overflow-visible">
            <h3 className="section-title mb-8">{t('tax.grossVsNet')}</h3>
            <div className="h-[400px] w-full">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={barData} barCategoryGap="25%" margin={{ top: 10, right: 10, left: 20, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="hsl(var(--border))" opacity={0.5} />
                  <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fontSize: 10, fontWeight: 800, fill: 'hsl(var(--foreground))' }} dy={10} />
                  <YAxis axisLine={false} tickLine={false} tickFormatter={(v) => `${(v / 1000000).toFixed(1)}M`} tick={{ fontSize: 10, fontWeight: 700, fill: 'hsl(var(--muted-foreground))' }} />
                  <Tooltip
                    cursor={{ fill: 'hsl(var(--primary) / 0.05)', radius: 12 }}
                    content={({ active, payload, label }) => {
                      if (active && payload && payload.length) {
                        return (
                          <div className="glass-card p-4 rounded-2xl shadow-2xl border-glass-border">
                            <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground/60 mb-2">{label}</p>
                            <div className="space-y-1.5">
                              <div className="flex items-center justify-between gap-8">
                                <span className="text-xs font-bold text-foreground/70">{t('tax.afterTaxValue')}</span>
                                <span className="text-xs font-black stat-value" style={{ color: payload[0].payload.color }}>
                                  {fc(payload[0].value as number)}
                                </span>
                              </div>
                              <div className="flex items-center justify-between gap-8">
                                <span className="text-xs font-bold text-foreground/70">{t('tax.taxPaid')}</span>
                                <span className="text-xs font-black stat-value text-red-500">
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
                  <Bar dataKey="net" name={t('tax.afterTaxValue')} radius={[10, 10, 0, 0]}>
                    {barData.map((d, i) => <Cell key={i} fill={d.color} fillOpacity={0.9} />)}
                  </Bar>
                  <Bar dataKey="tax" name={t('tax.taxPaid')} fill="#EF4444" fillOpacity={0.4} radius={[10, 10, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>

            <div className="mt-8 flex gap-3 no-print">
              <ExportButtons printRef={printRef} pdfData={pdfData} tabName="tax" />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default TaxImpactCalculator;
