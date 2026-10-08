import { describe, expect, test } from 'vite-plus/test';

import { formatMonth, getMonthFromDate, getMonthFromIndex, getMonthIndexFromString } from './months';

describe('month utilities', () => {
  test('maps zero-based date indexes to domain month values', () => {
    expect(getMonthFromIndex(0)).toBe('january');
    expect(getMonthFromDate(new Date(2026, 8, 6))).toBe('september');
  });

  test('maps domain month values to one-based API indexes', () => {
    expect(getMonthIndexFromString('january')).toBe(1);
    expect(getMonthIndexFromString('december')).toBe(12);
  });

  test('formats a month using the requested locale', () => {
    expect(formatMonth('march', 'de-DE')).toBe('März');
  });

  test('rejects invalid month values', () => {
    expect(() => getMonthFromIndex(12)).toThrow('Invalid month index: 12');
    expect(() => getMonthIndexFromString('smarch')).toThrow('is not a valid month');
  });
});
