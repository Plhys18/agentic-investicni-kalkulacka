import React from 'react';
import { safeNumber } from '@/lib/formatters';

interface SliderInputProps {
  label: string;
  value: number;
  onChange: (value: number) => void;
  min: number;
  max: number;
  step: number;
  unit: string;
}

const SliderInput: React.FC<SliderInputProps> = ({ label, value, onChange, min, max, step, unit }) => {
  const clamp = (v: number) => Math.min(max, Math.max(min, v));
  const progress = max > min ? ((value - min) / (max - min)) * 100 : 0;

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between gap-3">
        <label className="text-sm font-medium text-foreground">{label}</label>
        <div className="flex items-center gap-1.5 shrink-0">
          <input
            type="number"
            className="w-28 px-2.5 py-1.5 text-right text-sm border border-input rounded-lg bg-card text-foreground stat-value focus:ring-2 focus:ring-primary/30 focus:border-primary transition-all duration-200"
            value={value}
            onChange={(e) => onChange(clamp(safeNumber(e.target.value)))}
            min={min}
            max={max}
            step={step}
          />
          <span className="text-xs font-medium text-muted-foreground w-8">{unit}</span>
        </div>
      </div>
      <input
        type="range"
        className="w-full"
        value={value}
        onChange={(e) => onChange(safeNumber(e.target.value))}
        min={min}
        max={max}
        step={step}
        style={{ '--range-progress': `${progress}%` } as React.CSSProperties}
      />
    </div>
  );
};

export default SliderInput;
