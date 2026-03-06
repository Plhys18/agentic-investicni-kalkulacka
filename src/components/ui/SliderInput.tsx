import React, { useState, useEffect, useRef, useCallback } from 'react';
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

const THUMB_HIT_ZONE = 30; // px from thumb center to allow drag

const SliderInput: React.FC<SliderInputProps> = ({ label, value, onChange, min, max, step, unit }) => {
  const [textValue, setTextValue] = useState(formatInputDisplay(value));
  const [isFocused, setIsFocused] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const trackRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!isFocused) {
      setTextValue(formatInputDisplay(value));
    }
  }, [value, isFocused]);

  const clamp = (v: number) => Math.min(max, Math.max(min, v));
  const progress = max > min ? ((value - min) / (max - min)) * 100 : 0;

  const getValueFromPosition = useCallback((clientX: number) => {
    const track = trackRef.current;
    if (!track) return value;
    const rect = track.getBoundingClientRect();
    const ratio = Math.max(0, Math.min(1, (clientX - rect.left) / rect.width));
    const raw = min + ratio * (max - min);
    return clamp(Math.round(raw / step) * step);
  }, [min, max, step, value]);

  const getThumbPosition = useCallback(() => {
    const track = trackRef.current;
    if (!track) return 0;
    const rect = track.getBoundingClientRect();
    return rect.left + (progress / 100) * rect.width;
  }, [progress]);

  const isNearThumb = useCallback((clientX: number) => {
    const thumbX = getThumbPosition();
    return Math.abs(clientX - thumbX) <= THUMB_HIT_ZONE;
  }, [getThumbPosition]);

  // Touch handlers — only start drag if touch is near thumb
  const handleTouchStart = useCallback((e: React.TouchEvent) => {
    const touch = e.touches[0];
    if (isNearThumb(touch.clientX)) {
      setIsDragging(true);
      e.preventDefault(); // prevent scroll
    }
  }, [isNearThumb]);

  useEffect(() => {
    if (!isDragging) return;

    const handleTouchMove = (e: TouchEvent) => {
      e.preventDefault();
      const touch = e.touches[0];
      onChange(getValueFromPosition(touch.clientX));
    };

    const handleTouchEnd = () => {
      setIsDragging(false);
    };

    document.addEventListener('touchmove', handleTouchMove, { passive: false });
    document.addEventListener('touchend', handleTouchEnd);
    return () => {
      document.removeEventListener('touchmove', handleTouchMove);
      document.removeEventListener('touchend', handleTouchEnd);
    };
  }, [isDragging, getValueFromPosition, onChange]);

  // Mouse handlers for desktop
  const handleMouseDown = useCallback((e: React.MouseEvent) => {
    if (isNearThumb(e.clientX)) {
      setIsDragging(true);
      onChange(getValueFromPosition(e.clientX));
    }
  }, [isNearThumb, getValueFromPosition, onChange]);

  useEffect(() => {
    if (!isDragging) return;

    const handleMouseMove = (e: MouseEvent) => {
      onChange(getValueFromPosition(e.clientX));
    };

    const handleMouseUp = () => {
      setIsDragging(false);
    };

    document.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('mouseup', handleMouseUp);
    return () => {
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
    };
  }, [isDragging, getValueFromPosition, onChange]);

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
      {/* Custom slider track */}
      <div
        ref={trackRef}
        className="relative w-full h-8 flex items-center cursor-pointer select-none touch-none"
        onMouseDown={handleMouseDown}
        onTouchStart={handleTouchStart}
      >
        {/* Track background */}
        <div className="absolute left-0 right-0 h-1.5 rounded-full bg-muted">
          <div
            className="absolute left-0 top-0 h-full rounded-full bg-primary transition-none"
            style={{ width: `${progress}%` }}
          />
        </div>
        {/* Thumb */}
        <div
          className={`absolute w-5 h-5 rounded-full bg-primary border-2 border-primary-foreground shadow-md -translate-x-1/2 transition-shadow ${isDragging ? 'ring-4 ring-primary/30 scale-110' : ''}`}
          style={{ left: `${progress}%` }}
        />
      </div>
    </div>
  );
};

export default SliderInput;
