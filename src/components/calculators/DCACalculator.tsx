import React, { useMemo, useRef } from 'react';
import SliderInput from '@/components/ui/SliderInput';
import ResultCard from '@/components/ui/ResultCard';
import ExportButtons from '@/components/ui/ExportButtons';
import { calculateCompoundInterest } from '@/lib/calculations';
import { formatCurrency, formatPercent } from '@/lib/formatters';
import { useCurrency } from '@/hooks/useCurrency';
import { useLanguage } from '@/hooks/useLanguage';
import { useCalculatorStore } from '@/hooks/useCalculatorStore';
import { AreaChart, Area, XAxis, YAxis, Tooltip, Legend, ResponsiveContainer, BarChart, Bar, Cell } from 'recharts';
import { Bitcoin, Gem, CircleDollarSign } from 'lucide-react';

interface AssetInfo {
  id: string;
  labelKey: string;
  fallback: string;
  icon: React.ReactNode;
  color: string;
  avgReturn: number;
  descKey: string;
}

const ASSETS: AssetInfo[] = [
  { id: 'bitcoin', labelKey: '', fallback: 'Bitcoin', icon: <Bitcoin size={18} />, color: '#F7931A', avgReturn: 60, descKey: 'dca.btcDesc' },
  { id: 'ethereum', labelKey: '', fallback: 'Ethereum', icon: <Gem size={18} />, color: '#627EEA', avgReturn: 80, descKey: 'dca.ethDesc' },
  { id: 'gold', labelKey: 'dca.gold', fallback: 'Gold', icon: <CircleDollarSign size={18} />, color: '#D4AF37', avgReturn: 8, descKey: 'dca.goldDesc' },
  { id: 'silver', labelKey: 'dca.silver', fallback: 'Silver', icon: <CircleDollarSign size={18} />, color: '#C0C0C0', avgReturn: 6, descKey: 'dca.silverDesc' },
];

const DCACalculator: React.FC = () => {
  const { currency } = useCurrency();
  const { t } = useLanguage();
  const fc = (n: number) => formatCurrency(n, currency);
  const { dca, setDCA } = useCalculatorStore();
  const printRef = useRef<HTMLDivElement>(null);

  const { selectedAssets, initialInvestment, monthlyInvestment, years, customReturns } = dca;

  const toggleAsset = (id: string) => {
    setDCA({
      selectedAssets: selectedAssets.includes(id)
        ? (selectedAssets.length > 1 ? selectedAssets.filter((a) => a !== id) : selectedAssets)
        : [...selectedAssets, id],
    });
  };

  const getLabel = (asset: AssetInfo) => asset.labelKey ? t(asset.labelKey) : asset.fallback;
  const getReturn = (asset: AssetInfo) => customReturns[asset.id] ?? asset.avgReturn;

  const results = useMemo(() => {
    return selectedAssets.map((id) => {
      const asset = ASSETS.find((a) => a.id === id)!;
      const annualReturn = getReturn(asset);
      const calc = calculateCompoundInterest(initialInvestment, monthlyInvestment, annualReturn, years);
      const cagr = calc.totalInvested > 0 ? (Math.pow(calc.finalValue / calc.totalInvested, 1 / years) - 1) * 100 : 0;
      return { asset, calc, cagr };
    });
  }, [selectedAssets, monthlyInvestment, initialInvestment, years, customReturns]);

  const chartData = useMemo(() => {
    const data: Record<string, any>[] = [];
    for (let y = 1; y <= years; y++) {
      const point: Record<string, any> = { year: y };
      for (const r of results) {
        const entry = r.calc.timeline.find((ti) => ti.year === y);
        if (entry) point[r.asset.id] = entry.value;
      }
      data.push(point);
    }
    return data;
  }, [results, years]);

  const barData = useMemo(() => {
    return results.map((r) => ({
      name: getLabel(r.asset),
      value: r.calc.finalValue,
      color: r.asset.color,
    }));
  }, [results]);

  const pdfData = {
    title: 'DCA',
    inputs: {
      [t('dca.initialInvestment')]: fc(initialInvestment),
      [t('dca.monthlyDCA')]: fc(monthlyInvestment),
      [t('dca.horizon')]: `${years} ${t('common.years')}`,
    },
    results: Object.fromEntries(results.map((r) => [getLabel(r.asset), fc(r.calc.finalValue)])),
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-[minmax(0,420px)_1fr] gap-6">
      <div className="calculator-card space-y-5">
        <p className="section-title mb-2">{t('dca.selectAssets')}</p>
        <div className="grid grid-cols-2 gap-2">
          {ASSETS.map((asset) => {
            const isSelected = selectedAssets.includes(asset.id);
            return (
              <button
                key={asset.id}
                onClick={() => toggleAsset(asset.id)}
                className={`flex items-center gap-2.5 px-3.5 py-3 rounded-xl border transition-all duration-200 text-left ${
                  isSelected
                    ? 'border-primary bg-primary/10 text-foreground ring-1 ring-primary/30'
                    : 'border-border/50 bg-card text-muted-foreground hover:bg-secondary'
                }`}
              >
                <span style={{ color: asset.color }}>{asset.icon}</span>
                <span className="font-semibold text-sm">{getLabel(asset)}</span>
              </button>
            );
          })}
        </div>

        <div className="space-y-4">
          <SliderInput label={t('dca.initialInvestment')} value={initialInvestment} onChange={(v) => setDCA({ initialInvestment: v })} min={0} max={500000000} step={10000} unit={currency} />
          <SliderInput label={t('dca.monthlyDCA')} value={monthlyInvestment} onChange={(v) => setDCA({ monthlyInvestment: v })} min={0} max={50000000} step={500} unit={currency} />
          <SliderInput label={t('dca.horizon')} value={years} onChange={(v) => setDCA({ years: v })} min={1} max={30} step={1} unit={t('common.years')} />
        </div>

        <div className="border-t border-border/50 pt-4">
          <p className="section-title mb-3">{t('dca.expectedReturn')}</p>
          <div className="space-y-3">
            {selectedAssets.map((id) => {
              const asset = ASSETS.find((a) => a.id === id)!;
              return (
                <div key={id}>
                  <SliderInput
                    label={getLabel(asset)}
                    value={getReturn(asset)}
                    onChange={(v) => setDCA({ customReturns: { ...customReturns, [id]: v } })}
                    min={-20}
                    max={150}
                    step={1}
                    unit="%"
                  />
                  <p className="text-[10px] text-muted-foreground mt-0.5 leading-tight">{t(asset.descKey)}</p>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      <div className="space-y-6" ref={printRef}>
        <div className={`grid gap-4 ${results.length > 1 ? 'grid-cols-1 md:grid-cols-2' : 'grid-cols-1'}`}>
          {results.map((r) => (
            <ResultCard key={r.asset.id}>
              <div className="space-y-3">
                <div className="flex items-center gap-2.5">
                  <div className="w-8 h-8 rounded-lg flex items-center justify-center" style={{ backgroundColor: `${r.asset.color}20` }}>
                    <span style={{ color: r.asset.color }}>{r.asset.icon}</span>
                  </div>
                  <h3 className="font-bold text-foreground text-sm">{getLabel(r.asset)}</h3>
                </div>
                <div>
                  <p className="section-title mb-0.5">{t('common.totalValue')}</p>
                  <p className="text-3xl font-black stat-value tracking-tight" style={{ color: r.asset.color }}>{fc(r.calc.finalValue)}</p>
                </div>
                <div className="grid grid-cols-2 gap-x-4 gap-y-2">
                  <StatItem label={t('common.invested')} value={fc(r.calc.totalInvested)} />
                  <StatItem label={t('common.return')} value={fc(r.calc.totalEarnings)} className="text-profit" />
                  <StatItem label={t('common.roi')} value={formatPercent(r.calc.roi)} />
                  <StatItem label="CAGR" value={formatPercent(r.cagr)} />
                </div>
              </div>
            </ResultCard>
          ))}
        </div>

        <ExportButtons printRef={printRef} pdfData={pdfData} tabName="dca" />

        {results.length > 1 && (
          <div className="calculator-card">
            <h3 className="section-title mb-4">{t('dca.comparisonAfter')} {years} {t('common.years')}</h3>
            <div className="h-[280px]">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={barData} layout="vertical" barCategoryGap="20%">
                  <XAxis type="number" tickFormatter={(v) => `${(v / 1000000).toFixed(1)}M`} tick={{ fontSize: 12 }} />
                  <YAxis type="category" dataKey="name" tick={{ fontSize: 13, fontWeight: 600 }} width={90} />
                  <Tooltip formatter={(value: number) => fc(value)} contentStyle={{ borderRadius: 12, border: 'none', boxShadow: '0 4px 20px rgba(0,0,0,0.08)', fontFamily: 'JetBrains Mono, monospace', fontSize: 13 }} />
                  <Bar dataKey="value" name={t('common.totalValue')} radius={[0, 8, 8, 0]}>
                    {barData.map((d, i) => <Cell key={i} fill={d.color} fillOpacity={0.85} />)}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        )}

        <div className="calculator-card">
          <h3 className="section-title mb-4">{t('dca.growthOverTime')}</h3>
          <div className="h-[350px] lg:h-[450px]">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={chartData}>
                <defs>
                  {results.map((r) => (
                    <linearGradient key={r.asset.id} id={`grad-${r.asset.id}`} x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor={r.asset.color} stopOpacity={0.4} />
                      <stop offset="100%" stopColor={r.asset.color} stopOpacity={0.03} />
                    </linearGradient>
                  ))}
                </defs>
                <XAxis dataKey="year" tick={{ fontSize: 12 }} />
                <YAxis tickFormatter={(v) => `${(v / 1000000).toFixed(1)}M`} tick={{ fontSize: 12 }} />
                <Tooltip formatter={(value: number) => fc(value)} contentStyle={{ borderRadius: 12, border: 'none', boxShadow: '0 4px 20px rgba(0,0,0,0.08)', fontFamily: 'JetBrains Mono, monospace', fontSize: 13 }} />
                <Legend />
                {results.map((r) => (
                  <Area key={r.asset.id} type="monotone" dataKey={r.asset.id} name={getLabel(r.asset)} fill={`url(#grad-${r.asset.id})`} stroke={r.asset.color} strokeWidth={2.5} />
                ))}
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>
    </div>
  );
};

const StatItem: React.FC<{ label: string; value: string; className?: string }> = ({ label, value, className = 'text-foreground' }) => (
  <div>
    <p className="text-xs text-muted-foreground mb-0.5">{label}</p>
    <p className={`text-base font-bold stat-value ${className}`}>{value}</p>
  </div>
);

export default DCACalculator;
