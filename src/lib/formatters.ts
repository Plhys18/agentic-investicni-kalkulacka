import type { Currency } from '@/hooks/useCurrency';

const localeMap: Record<Currency, string> = {
  CZK: 'cs-CZ',
  EUR: 'de-DE',
  USD: 'en-US',
};

export function formatCurrency(amount: number, currency: Currency = 'CZK'): string {
  return new Intl.NumberFormat(localeMap[currency], {
    style: 'currency',
    currency,
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount);
}

export function formatNumber(num: number, decimals: number = 0): string {
  return new Intl.NumberFormat('cs-CZ', {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  }).format(num);
}

export function formatPercent(value: number, decimals: number = 1): string {
  return `${formatNumber(value, decimals)} %`;
}

export function formatCompact(num: number, currency: Currency = 'CZK'): string {
  const abs = Math.abs(num);
  const sign = num < 0 ? '-' : '';
  const sym = currency === 'CZK' ? 'CZK' : currency === 'EUR' ? '€' : '$';
  if (abs >= 1_000_000) {
    return `${sign}${(abs / 1_000_000).toFixed(1).replace('.', ',')}M ${sym}`;
  } else if (abs >= 1_000) {
    return `${sign}${(abs / 1_000).toFixed(0)}K ${sym}`;
  }
  return formatCurrency(num, currency);
}

export function safeNumber(val: string | number): number {
  const n = Number(val);
  return isNaN(n) ? 0 : n;
}

/** Format a number with thousand separators for display in inputs */
export function formatInputDisplay(num: number): string {
  return new Intl.NumberFormat('cs-CZ', {
    minimumFractionDigits: 0,
    maximumFractionDigits: 2,
  }).format(num);
}

/** Parse a formatted input string back to number */
export function parseInputValue(val: string): number {
  // Remove spaces (thousand sep) and replace comma with dot
  const cleaned = val.replace(/\s/g, '').replace(',', '.');
  const n = Number(cleaned);
  return isNaN(n) ? 0 : n;
}
