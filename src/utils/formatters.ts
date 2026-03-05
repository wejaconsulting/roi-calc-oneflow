import { CURRENCY_RATES } from '@/config/assumptions';
import type { CurrencyCode } from '@/types';

export function formatCurrency(value: number, currency: CurrencyCode): string {
  const config = CURRENCY_RATES[currency];
  if (!config) return value.toLocaleString();

  try {
    const currencyMap: Record<string, string> = {
      SEK: 'SEK',
      NOK: 'NOK',
      EUR: 'EUR',
      USD: 'USD',
      GBP: 'GBP',
    };
    return new Intl.NumberFormat(config.locale, {
      style: 'currency',
      currency: currencyMap[currency] || currency,
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(value);
  } catch {
    return `${config.symbol}${value.toLocaleString()}`;
  }
}

export function formatNumber(value: number, decimals = 0): string {
  return value.toLocaleString(undefined, {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  });
}

export function formatPercent(value: number, decimals = 0): string {
  return `${value.toFixed(decimals)}%`;
}

/**
 * Format ROI for display. Shows "Xx return" for values above 1000%
 * to avoid incredible-looking percentages.
 */
export function formatROI(value: number): string {
  if (value >= 1000) {
    return `${(value / 100).toFixed(0)}x return`;
  }
  return `${value.toFixed(0)}%`;
}

export function formatMonths(value: number): string {
  if (value < 1) return `${Math.round(value * 30)} days`;
  if (value < 12) return `${value.toFixed(1)} months`;
  return `${(value / 12).toFixed(1)} years`;
}
