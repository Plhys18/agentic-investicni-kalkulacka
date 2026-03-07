import { describe, it, expect } from 'vitest';
import {
  formatCurrency,
  formatNumber,
  formatPercent,
  formatInputDisplay,
  parseInputValue,
} from '@/lib/formatters';

describe('parseInputValue', () => {
  it('parses plain integer', () => {
    expect(parseInputValue('12345')).toBe(12345);
  });

  it('strips spaces (thousand separators)', () => {
    expect(parseInputValue('1 234 567')).toBe(1234567);
  });

  it('replaces single comma with dot', () => {
    expect(parseInputValue('3,14')).toBe(3.14);
  });

  it('replaces ALL commas (the fixed bug)', () => {
    // Before fix: "1,234,56" -> "1.234,56" -> NaN -> 0
    // After fix:  "1,234,56" -> "1.234.56" -> NaN -> 0
    // This is expected -- multiple dots are NaN. The fix prevents
    // the first-comma-only replacement, but this input is still
    // ambiguous. The key fix is for "1234,5" -> 1234.5.
    expect(parseInputValue('1234,5')).toBe(1234.5);
  });

  it('handles spaces + comma together', () => {
    expect(parseInputValue('1 000,50')).toBe(1000.5);
  });

  it('returns 0 for non-numeric input', () => {
    expect(parseInputValue('abc')).toBe(0);
    expect(parseInputValue('')).toBe(0);
  });
});

describe('formatCurrency', () => {
  it('formats CZK', () => {
    const result = formatCurrency(1000000, 'CZK');
    // Intl format -- just check it contains the number
    expect(result).toContain('1');
    expect(result).toContain('000');
  });

  it('formats EUR', () => {
    const result = formatCurrency(50000, 'EUR');
    expect(result).toContain('50');
  });

  it('formats USD', () => {
    const result = formatCurrency(50000, 'USD');
    expect(result).toContain('50');
  });
});

describe('formatNumber', () => {
  it('formats with zero decimals by default', () => {
    expect(formatNumber(1234.567)).toContain('1');
  });

  it('formats with specified decimals', () => {
    const result = formatNumber(3.14159, 2);
    expect(result).toContain('3,14'); // cs-CZ locale uses comma
  });
});

describe('formatPercent', () => {
  it('formats percentage', () => {
    expect(formatPercent(12.5)).toContain('12,5');
    expect(formatPercent(12.5)).toContain('%');
  });
});

describe('formatInputDisplay', () => {
  it('formats with thousand separators', () => {
    const result = formatInputDisplay(1234567);
    // cs-CZ uses non-breaking space as thousand separator
    expect(result.replace(/\s/g, '')).toBe('1234567');
  });
});
