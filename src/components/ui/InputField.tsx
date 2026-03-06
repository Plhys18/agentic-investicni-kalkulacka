import React from 'react';
import { safeNumber } from '@/lib/formatters';

interface InputFieldProps {
  label: string;
  value: number;
  onChange: (value: number) => void;
  min?: number;
  max?: number;
  step?: number;
  unit?: string;
  readOnly?: boolean;
  displayValue?: string;
}

const InputField: React.FC<InputFieldProps> = ({ label, value, onChange, min, max, step = 1, unit, readOnly, displayValue }) => {
  if (readOnly) {
    return (
      <div className="space-y-1.5">
        <label className="text-sm font-medium text-foreground">{label}</label>
        <div className="input-field bg-muted/50 cursor-default stat-value">
          {displayValue ?? value} {unit}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-1.5">
      <label className="text-sm font-medium text-foreground">{label}</label>
      <div className="flex items-center gap-2">
        <input
          type="number"
          className="input-field stat-value"
          value={value}
          onChange={(e) => {
            let v = safeNumber(e.target.value);
            if (max !== undefined && v > max) v = max;
            if (min !== undefined && v < min) v = min;
            onChange(v);
          }}
          min={min}
          max={max}
          step={step}
        />
        {unit && <span className="text-sm font-medium text-muted-foreground whitespace-nowrap">{unit}</span>}
      </div>
    </div>
  );
};

export default InputField;
