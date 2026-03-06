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

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <label className="text-sm font-medium text-muted-foreground">{label}</label>
        <div className="flex items-center gap-1">
          <input
            type="number"
            className="w-28 px-2 py-1 text-right text-sm border border-input rounded-md bg-card text-foreground [font-variant-numeric:tabular-nums]"
            value={value}
            onChange={(e) => onChange(clamp(safeNumber(e.target.value)))}
            min={min}
            max={max}
            step={step}
          />
          <span className="text-xs text-muted-foreground w-8">{unit}</span>
        </div>
      </div>
      <input
        type="range"
        className="w-full h-2 rounded-lg appearance-none cursor-pointer accent-primary"
        value={value}
        onChange={(e) => onChange(safeNumber(e.target.value))}
        min={min}
        max={max}
        step={step}
      />
    </div>
  );
};

export default SliderInput;
