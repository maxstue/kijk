import { describe, expect, test } from 'vite-plus/test';

import type { CsvImportMapping } from '@/shared/api/imports/types';

import { assignColumnRole, createEmptyMapping, getColumnRoles, getMissingMappingFields } from './helpers';

const empty: CsvImportMapping = createEmptyMapping({
  delimiter: ';',
  encoding: 'utf-8',
  headerRowIndex: 0,
  headers: ['Datum', 'Betrag', 'Name'],
  recordCount: 3,
  rows: [],
});

describe('assignColumnRole', () => {
  test('moves a role from its previous column', () => {
    const first = assignColumnRole(empty, 0, 'dateColumn');
    const moved = assignColumnRole(first, 2, 'dateColumn');

    expect(moved.dateColumn).toBe(2);
    expect(getColumnRoles(moved).has(0)).toBe(false);
  });

  test('replaces the previous role of the column', () => {
    const mapping = assignColumnRole(assignColumnRole(empty, 1, 'purposeColumn'), 1, 'amountColumn');

    expect(mapping.purposeColumn).toBeNull();
    expect(mapping.amountColumn).toBe(1);
  });

  test('a signed amount column replaces debit and credit columns', () => {
    const split = assignColumnRole(assignColumnRole(empty, 1, 'debitColumn'), 2, 'creditColumn');
    const amount = assignColumnRole(split, 0, 'amountColumn');

    expect(amount.debitColumn).toBeNull();
    expect(amount.creditColumn).toBeNull();
  });
});

describe('getMissingMappingFields', () => {
  test('requires a date and an amount', () => {
    expect(getMissingMappingFields(empty)).toBe('Choose the booking date column');
    expect(getMissingMappingFields(assignColumnRole(empty, 0, 'dateColumn'))).toContain('amount');
    expect(
      getMissingMappingFields(assignColumnRole(assignColumnRole(empty, 0, 'dateColumn'), 1, 'amountColumn')),
    ).toBeUndefined();
  });
});
