export function formatCurrency(amount: number): string {
  return new Intl.NumberFormat('cs-CZ', {
    style: 'currency',
    currency: 'CZK',
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

export function formatCompact(num: number): string {
  const abs = Math.abs(num);
  const sign = num < 0 ? '-' : '';
  if (abs >= 1_000_000) {
    return `${sign}${(abs / 1_000_000).toFixed(1).replace('.', ',')}M CZK`;
  } else if (abs >= 1_000) {
    return `${sign}${(abs / 1_000).toFixed(0)}K CZK`;
  }
  return formatCurrency(num);
}

export function safeNumber(val: string | number): number {
  const n = Number(val);
  return isNaN(n) ? 0 : n;
}
