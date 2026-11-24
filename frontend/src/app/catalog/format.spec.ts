import { formatValue, statusTone, trendOf } from './format';

describe('E1-S3: value formatting', () => {
  it('formats currency, numbers, percent and dates in en-US', () => {
    expect(formatValue(48210.55, 'currency')).toBe('$48,210.55');
    expect(formatValue(1000, 'currency', 'EUR')).toBe('€1,000.00');
    expect(formatValue(1234.5, 'number')).toBe('1,234.5');
    expect(formatValue(2.1, 'percent')).toBe('2.1%');
    expect(formatValue('2026-11-24', 'date')).toBe('Nov 24, 2026');
  });

  it('signs changes when asked', () => {
    expect(formatValue(412.3, 'currency', 'USD', true)).toBe('+$412.30');
    expect(formatValue(-0.8, 'percent', 'USD', true)).toBe('-0.8%');
  });

  it('shows a dash for missing or unusable values, never "undefined" or "NaN"', () => {
    for (const v of [null, undefined, '', 'abc']) expect(formatValue(v, 'currency')).toBe('—');
    expect(formatValue('not a date', 'date')).toBe('—');
  });

  it('derives trends and status tones', () => {
    expect([trendOf(1), trendOf(-1), trendOf(0), trendOf(undefined)]).toEqual(['up', 'down', 'flat', 'flat']);
    expect(['filled', 'Pending', 'partially filled', 'rejected', 'cancelled'].map(statusTone)).toEqual(['success', 'info', 'info', 'danger', 'neutral']);
  });
});
