import React, { useState, useEffect } from 'react';
import { formatInputDisplay, parseInputValue } from '@/lib/formatters';

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
  const [textValue, setTextValue] = useState(formatInputDisplay(value));
  const [isFocused, setIsFocused] = useState(false);

  useEffect(() => {
    if (!isFocused) {
      setTextValue(formatInputDisplay(value));
    }
  }, [value, isFocused]);

  if (readOnly) {
    return (
      <div className="space-y-1.5">
        <label className="text-sm font-medium text-foreground">{label}</label>
        <div className="input-field bg-muted/50 cursor-default stat-value">
          {displayValue ?? formatInputDisplay(value)} {unit}
        </div>
      </div>
    );
  }

  const handleBlur = () => {
    setIsFocused(false);
    let v = parseInputValue(textValue);
    if (max !== undefined && v > max) v = max;
    if (min !== undefined && v < min) v = min;
    onChange(v);
    setTextValue(formatInputDisplay(v));
  };

  return (
    <div className="space-y-1.5">
      <label className="text-sm font-medium text-foreground">{label}</label>
      <div className="flex items-center gap-2">
        <input
          type="text"
          inputMode="decimal"
          className="input-field stat-value"
          value={textValue}
          onFocus={() => {
            setIsFocused(true);
            setTextValue(String(value));
          }}
          onChange={(e) => setTextValue(e.target.value)}
          onBlur={handleBlur}
          onKeyDown={(e) => {
            if (e.key === 'Enter') (e.target as HTMLInputElement).blur();
          }}
        />
        {unit && <span className="text-sm font-medium text-muted-foreground whitespace-nowrap">{unit}</span>}
      </div>
    </div>
  );
};

export default InputField;
