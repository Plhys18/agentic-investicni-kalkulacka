import React, { useMemo, useRef, useCallback } from 'react';
import SliderInput from '@/components/ui/SliderInput';
import ResultCard from '@/components/ui/ResultCard';
import ExportButtons from '@/components/ui/ExportButtons';
import { calculateCompoundInterest } from '@/lib/calculations';
import { maxAmount, maxMonthly } from '@/lib/constants';
import { formatCurrency, formatPercent } from '@/lib/formatters';
import { useCurrency } from '@/hooks/useCurrency';
import { useLanguage } from '@/hooks/useLanguage';
import { useCalculatorStore } from '@/hooks/useCalculatorStore';
import { AreaChart, Area, XAxis, YAxis, Tooltip, CartesianGrid, ResponsiveContainer, BarChart, Bar, Cell } from 'recharts';
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
  { id: 'bitcoin', labelKey: '', fallback: 'Bitcoin', icon: <Bitcoin size={18} />, color: '#F7931A', avgReturn: 15, descKey: 'dca.btcDesc' },
  { id: 'ethereum', labelKey: '', fallback: 'Ethereum', icon: <Gem size={18} />, color: '#627EEA', avgReturn: 20, descKey: 'dca.ethDesc' },
  { id: 'gold', labelKey: 'dca.gold', fallback: 'Gold', icon: <CircleDollarSign size={18} />, color: '#D4AF37', avgReturn: 8, descKey: 'dca.goldDesc' },
  { id: 'silver', labelKey: 'dca.silver', fallback: 'Silver', icon: <CircleDollarSign size={18} />, color: '#C0C0C0', avgReturn: 6, descKey: 'dca.silverDesc' },
];

const DCACalculator: React.FC = () => {
  const { currency } = useCurrency();
  const { lang, t } = useLanguage();
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

  const getLabel = useCallback((asset: AssetInfo) => asset.labelKey ? t(asset.labelKey) : asset.fallback, [t]);
  const getReturn = useCallback((asset: AssetInfo) => customReturns[asset.id] ?? asset.avgReturn, [customReturns]);

  const results = useMemo(() => {
    return selectedAssets.map((id) => {
      const asset = ASSETS.find((a) => a.id === id)!;
      const annualReturn = getReturn(asset);
      const calc = calculateCompoundInterest(initialInvestment, monthlyInvestment, annualReturn, years);
      const cagr = calc.totalInvested > 0 ? (Math.pow(calc.finalValue / calc.totalInvested, 1 / years) - 1) * 100 : 0;
      return { asset, calc, cagr };
    });
  }, [selectedAssets, monthlyInvestment, initialInvestment, years, getReturn]);

  const chartData = useMemo(() => {
    const data: Record<string, number>[] = [];
    for (let y = 1; y <= years; y++) {
      const point: Record<string, number> = { year: y };
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
  }, [results, getLabel]);

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
    <div className="max-w-6xl mx-auto space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-1000" ref={printRef}>
      <div className="flex flex-col lg:flex-row gap-8">
        {/* Sidebar Inputs */}
        <div className="lg:w-1/3 space-y-8 no-print">
          <div className="calculator-card">
            <h3 className="section-title">{t('dca.selectAssets')}</h3>
            <div className="grid grid-cols-2 gap-3 mb-8">
              {ASSETS.map((asset) => {
                const isSelected = selectedAssets.includes(asset.id);
                return (
                  <button
                    key={asset.id}
                    onClick={() => toggleAsset(asset.id)}
                    className={`flex flex-col items-center justify-center gap-3 p-4 rounded-2xl border-2 transition-all duration-300 ${
                      isSelected
                        ? 'bg-primary/10 border-primary shadow-lg shadow-primary/5'
                        : 'bg-secondary/40 border-transparent hover:bg-secondary hover:border-border/50 opacity-60'
                    }`}
                  >
                    <div className="w-10 h-10 rounded-xl flex items-center justify-center bg-card shadow-sm" style={{ color: asset.color }}>
                      {asset.icon}
                    </div>
                    <span className="font-black text-[10px] uppercase tracking-widest text-foreground">{getLabel(asset)}</span>
                  </button>
                );
              })}
            </div>

            <div className="space-y-10">
              <SliderInput label={t('dca.initialInvestment')} value={initialInvestment} onChange={(v) => setDCA({ initialInvestment: v })} min={0} max={maxAmount(currency)} step={10000} unit={currency} />
              <SliderInput label={t('dca.monthlyDCA')} value={monthlyInvestment} onChange={(v) => setDCA({ monthlyInvestment: v })} min={0} max={maxMonthly(currency)} step={500} unit={currency} />
              <SliderInput label={t('dca.horizon')} value={years} onChange={(v) => setDCA({ years: v })} min={1} max={30} step={1} unit={t('common.years')} />
            </div>

            <div className="mt-10 pt-10 border-t border-glass-border space-y-8">
              <h3 className="section-title">{t('dca.expectedReturn')}</h3>
              <div className="space-y-8">
                {selectedAssets.map((id) => {
                  const asset = ASSETS.find((a) => a.id === id)!;
                  return (
                    <div key={id} className="space-y-2">
                       <SliderInput
                        label={getLabel(asset)}
                        value={getReturn(asset)}
                        onChange={(v) => setDCA({ customReturns: { ...customReturns, [id]: v } })}
                        min={-20}
                        max={150}
                        step={1}
                        unit="%"
                      />
                      <p className="text-[10px] text-muted-foreground/60 italic leading-tight ml-1">{t(asset.descKey)}</p>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        </div>

        {/* Results Area */}
        <div className="lg:w-2/3 space-y-8">
          <div className={`grid gap-6 ${results.length > 1 ? 'grid-cols-1 md:grid-cols-2' : 'grid-cols-1'}`}>
            {results.map((r) => (
              <ResultCard key={r.asset.id} className="relative overflow-hidden group">
                <div className="absolute -top-12 -right-12 w-32 h-32 bg-primary/5 rounded-full blur-3xl group-hover:bg-primary/10 transition-colors" />
                <div className="space-y-4 relative z-10">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl flex items-center justify-center bg-card shadow-sm border border-glass-border" style={{ color: r.asset.color }}>
                      {r.asset.icon}
                    </div>
                    <p className="text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground/60">{getLabel(r.asset)}</p>
                  </div>
                  <div>
                    <p className="text-3xl font-black stat-value tracking-tight" style={{ color: r.asset.color }}>
                      {fc(r.calc.finalValue)}
                    </p>
                  </div>
                  <div className="grid grid-cols-2 gap-x-6 gap-y-3 pt-2 border-t border-glass-border/30">
                    <StatItem label={t('common.invested')} value={fc(r.calc.totalInvested)} />
                    <StatItem label={t('common.return')} value={fc(r.calc.totalEarnings)} className="text-profit" />
                    <StatItem label={t('common.roi')} value={formatPercent(r.calc.roi)} />
                    <StatItem label="CAGR" value={formatPercent(r.cagr)} />
                  </div>
                </div>
              </ResultCard>
            ))}
          </div>

          <div className="calculator-card overflow-visible">
            <h3 className="section-title mb-8">{t('dca.growthOverTime')}</h3>
            <div className="h-[450px] w-full mt-4">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={chartData} margin={{ top: 10, right: 10, left: 20, bottom: 0 }}>
                  <defs>
                    {results.map((r) => (
                      <linearGradient key={r.asset.id} id={`grad-${r.asset.id}`} x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor={r.asset.color} stopOpacity={0.2} />
                        <stop offset="95%" stopColor={r.asset.color} stopOpacity={0} />
                      </linearGradient>
                    ))}
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
                    content={({ active, payload, label }) => {
                      if (active && payload && payload.length) {
                        return (
                          <div className="glass-card p-4 rounded-2xl shadow-2xl border-glass-border">
                            <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground/60 mb-2">
                              {t('common.year')} {label}
                            </p>
                            <div className="space-y-2">
                              {payload.map((entry: any, i) => (
                                <div key={i} className="flex items-center justify-between gap-10">
                                  <div className="flex items-center gap-2">
                                    <div className="w-2 h-2 rounded-full" style={{ backgroundColor: entry.stroke }} />
                                    <span className="text-xs font-bold text-foreground/70">{entry.name}</span>
                                  </div>
                                  <span className="text-xs font-black stat-value" style={{ color: entry.stroke }}>
                                    {fc(entry.value as number)}
                                  </span>
                                </div>
                              ))}
                            </div>
                          </div>
                        );
                      }
                      return null;
                    }}
                  />
                  {results.map((r) => (
                    <Area 
                      key={r.asset.id} 
                      type="monotone" 
                      dataKey={r.asset.id} 
                      name={getLabel(r.asset)} 
                      stroke={r.asset.color} 
                      strokeWidth={3} 
                      fillOpacity={1}
                      fill={`url(#grad-${r.asset.id})`}
                    />
                  ))}
                </AreaChart>
              </ResponsiveContainer>
            </div>

            {results.length > 1 && (
              <div className="mt-12 pt-12 border-t border-glass-border">
                <h3 className="section-title mb-8">{t('dca.comparisonAfter')} {years} {t('common.years')}</h3>
                <div className="h-[280px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={barData} layout="vertical" barCategoryGap="20%">
                      <XAxis type="number" axisLine={false} tickLine={false} tickFormatter={(v) => `${(v / 1000000).toFixed(1)}M`} tick={{ fontSize: 10, fill: 'hsl(var(--muted-foreground))' }} />
                      <YAxis type="category" dataKey="name" axisLine={false} tickLine={false} tick={{ fontSize: 10, fontWeight: 800, fill: 'hsl(var(--foreground))' }} width={90} />
                      <Tooltip formatter={(value: number) => fc(value)} contentStyle={{ borderRadius: 16, border: 'none', boxShadow: '0 8px 32px rgba(0,0,0,0.15)', fontFamily: 'JetBrains Mono, monospace', fontSize: 12, backgroundColor: 'hsl(var(--card))' }} />
                      <Bar dataKey="value" name={t('common.totalValue')} radius={[0, 12, 12, 0]}>
                        {barData.map((d, i) => <Cell key={i} fill={d.color} />)}
                      </Bar>
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </div>
            )}

            <div className="mt-8 flex gap-3 no-print">
              <ExportButtons printRef={printRef} pdfData={pdfData} tabName="dca" />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

const StatItem: React.FC<{ label: string; value: string; className?: string }> = ({ label, value, className = 'text-foreground' }) => (
  <div>
    <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground/50 mb-1">{label}</p>
    <p className={`text-base font-bold stat-value ${className}`}>{value}</p>
  </div>
);

export default DCACalculator;
