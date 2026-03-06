import React, { useState, useEffect } from 'react';
import { formatInputDisplay, parseInputValue } from '@/lib/formatters';

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
  const [textValue, setTextValue] = useState(formatInputDisplay(value));
  const [isFocused, setIsFocused] = useState(false);

  useEffect(() => {
    if (!isFocused) {
      setTextValue(formatInputDisplay(value));
    }
  }, [value, isFocused]);

  const clamp = (v: number) => Math.min(max, Math.max(min, v));
  const progress = max > min ? ((value - min) / (max - min)) * 100 : 0;

  const handleBlur = () => {
    setIsFocused(false);
    const parsed = parseInputValue(textValue);
    const clamped = clamp(parsed);
    onChange(clamped);
    setTextValue(formatInputDisplay(clamped));
  };

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between gap-3">
        <label className="text-sm font-medium text-foreground">{label}</label>
        <div className="flex items-center gap-1.5 shrink-0">
          <input
            type="text"
            inputMode="decimal"
            className="w-32 px-2.5 py-1.5 text-right text-sm border border-input rounded-lg bg-card text-foreground stat-value focus:ring-2 focus:ring-primary/30 focus:border-primary transition-all duration-200"
            value={textValue}
            onFocus={() => {
              setIsFocused(true);
              setTextValue(String(value));
            }}
            onChange={(e) => setTextValue(e.target.value)}
            onBlur={handleBlur}
            onKeyDown={(e) => {
              if (e.key === 'Enter') {
                (e.target as HTMLInputElement).blur();
              }
            }}
          />
          <span className="text-xs font-medium text-muted-foreground w-8">{unit}</span>
        </div>
      </div>
      <input
        type="range"
        className="w-full"
        value={value}
        onChange={(e) => onChange(Number(e.target.value))}
        min={min}
        max={max}
        step={step}
        style={{ '--range-progress': `${progress}%` } as React.CSSProperties}
      />
    </div>
  );
};

export default SliderInput;
