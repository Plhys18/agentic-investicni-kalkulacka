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

  const clamp = useCallback((v: number) => Math.min(max, Math.max(min, v)), [min, max]);
  const progress = max > min ? ((value - min) / (max - min)) * 100 : 0;

  const getValueFromPosition = useCallback((clientX: number) => {
    const track = trackRef.current;
    if (!track) return min;
    const rect = track.getBoundingClientRect();
    const ratio = Math.max(0, Math.min(1, (clientX - rect.left) / rect.width));
    const raw = min + ratio * (max - min);
    return clamp(Math.round(raw / step) * step);
  }, [min, max, step, clamp]);

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

  const handleKeyDown = useCallback((e: React.KeyboardEvent) => {
    let newValue = value;
    switch (e.key) {
      case 'ArrowRight':
      case 'ArrowUp':
        newValue = clamp(value + step);
        break;
      case 'ArrowLeft':
      case 'ArrowDown':
        newValue = clamp(value - step);
        break;
      case 'Home':
        newValue = min;
        break;
      case 'End':
        newValue = max;
        break;
      case 'PageUp':
        newValue = clamp(value + step * 10);
        break;
      case 'PageDown':
        newValue = clamp(value - step * 10);
        break;
      default:
        return; // don't prevent default for other keys
    }
    e.preventDefault();
    onChange(newValue);
  }, [value, step, min, max, onChange, clamp]);

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
    <div className="space-y-3">
      <div className="flex items-center justify-between gap-3 px-1">
        <label className="text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground/80">{label}</label>
        <div className="flex items-center gap-2 group">
          <input
            type="text"
            inputMode="decimal"
            className="w-28 px-4 py-2 text-right text-xs font-bold border border-input rounded-xl bg-secondary/30 text-foreground stat-value focus:ring-4 focus:ring-primary/20 focus:border-primary transition-all duration-300 outline-none"
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
          <span className="text-[10px] font-black uppercase tracking-widest text-muted-foreground/40 w-8">{unit}</span>
        </div>
      </div>
      
      <div
        ref={trackRef}
        className="relative w-full h-10 flex items-center cursor-pointer select-none touch-none group"
        role="slider"
        tabIndex={0}
        aria-label={label}
        aria-valuemin={min}
        aria-valuemax={max}
        aria-valuenow={value}
        onMouseDown={handleMouseDown}
        onTouchStart={handleTouchStart}
        onKeyDown={handleKeyDown}
      >
        {/* Track background */}
        <div className="absolute left-0 right-0 h-2 rounded-full bg-secondary/50 overflow-hidden">
          <div
            className="absolute left-0 top-0 h-full rounded-full bg-gradient-to-r from-primary/80 to-primary transition-none"
            style={{ width: `${progress}%` }}
          />
        </div>
        
        {/* Progress Fill Shadow */}
        <div 
          className="absolute left-0 h-4 bg-primary/10 blur-md rounded-full transition-none pointer-events-none"
          style={{ width: `${progress}%` }}
        />

        {/* Thumb */}
        <div
          className={`absolute w-7 h-7 rounded-full bg-primary border-4 border-background shadow-2xl -translate-x-1/2 transition-all duration-300 cubic-bezier(0.34, 1.56, 0.64, 1) ${
            isDragging ? 'scale-125 ring-8 ring-primary/10' : 'group-hover:scale-110 group-hover:ring-8 group-hover:ring-primary/5'
          }`}
          style={{ left: `${progress}%` }}
        >
          <div className="absolute inset-0 rounded-full border border-white/20" />
        </div>
      </div>
    </div>
  );
};

export default SliderInput;
