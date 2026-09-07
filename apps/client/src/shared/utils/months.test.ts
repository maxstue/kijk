import { describe, expect, it } from 'vitest';

import { formatMonth, getMonthFromDate, getMonthFromIndex, getMonthIndexFromString } from './months';

describe('month utilities', () => {
  it('maps zero-based date indexes to domain month values', () => {
    expect(getMonthFromIndex(0)).toBe('january');
    expect(getMonthFromDate(new Date(2026, 8, 6))).toBe('september');
  });

  it('maps domain month values to one-based API indexes', () => {
    expect(getMonthIndexFromString('january')).toBe(1);
    expect(getMonthIndexFromString('december')).toBe(12);
  });

  it('formats a month using the requested locale', () => {
    expect(formatMonth('march', 'de-DE')).toBe('März');
  });

  it('rejects invalid month values', () => {
    expect(() => getMonthFromIndex(12)).toThrow('Invalid month index: 12');
    expect(() => getMonthIndexFromString('smarch')).toThrow('is not a valid month');
  });
});
