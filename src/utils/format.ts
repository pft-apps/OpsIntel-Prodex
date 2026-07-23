/**
 * Centralized utility for formatting numbers to two decimal places.
 */

export function formatNumber(val: number | string | undefined | null, fallback = '—'): string {
  if (val === undefined || val === null) return fallback;
  const num = typeof val === 'string' ? parseFloat(val) : val;
  if (isNaN(num)) return fallback;
  return num.toFixed(2);
}
