/**
 * Value formatting for catalog components. Specs choose a `format`; the numbers themselves
 * always come from the data model (rule 5). Locale is fixed to en-US until the app has a
 * locale setting.
 */
export const VALUE_FORMATS = ['text', 'number', 'currency', 'percent', 'date'] as const;
export type ValueFormat = (typeof VALUE_FORMATS)[number];

export const TONES = ['neutral', 'info', 'success', 'warning', 'danger'] as const;
export type Tone = (typeof TONES)[number];

const LOCALE = 'en-US';
const EMPTY = '—';

/**
 * Formats one value. `percent` values are in percent units (2.1 means 2.1%).
 * Missing values render as an em dash, never as "undefined" or "NaN".
 */
export function formatValue(value: unknown, format: ValueFormat, currency = 'USD', signed = false): string {
  if (value === null || value === undefined || value === '') return EMPTY;
  if (format === 'text') return String(value);
  if (format === 'date') {
    const date = new Date(String(value));
    return Number.isNaN(date.getTime())
      ? EMPTY
      : new Intl.DateTimeFormat(LOCALE, { dateStyle: 'medium', timeZone: 'UTC' }).format(date);
  }
  const n = typeof value === 'number' ? value : Number(value);
  if (!Number.isFinite(n)) return EMPTY;
  const signDisplay = signed ? 'exceptZero' : 'auto';
  switch (format) {
    case 'currency':
      return new Intl.NumberFormat(LOCALE, { style: 'currency', currency, signDisplay }).format(n);
    case 'percent':
      return new Intl.NumberFormat(LOCALE, { style: 'percent', maximumFractionDigits: 2, signDisplay }).format(n / 100);
    default:
      return new Intl.NumberFormat(LOCALE, { maximumFractionDigits: 4, signDisplay }).format(n);
  }
}

/** Direction of a change value, for up/down styling. */
export function trendOf(value: unknown): 'up' | 'down' | 'flat' {
  const n = Number(value);
  if (!Number.isFinite(n) || n === 0) return 'flat';
  return n > 0 ? 'up' : 'down';
}

/** Tone for an order or account status shown as a Badge (E2-S2 order states). */
export function statusTone(status: unknown): Tone {
  switch (String(status ?? '').toLowerCase().replace(/[\s-]+/g, '_')) {
    case 'filled':
    case 'active':
    case 'open':
      return 'success';
    case 'pending':
    case 'partially_filled':
      return 'info';
    case 'rejected':
    case 'failed':
      return 'danger';
    default:
      return 'neutral';
  }
}
