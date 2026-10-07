import type { ColumnRole } from '@/app/imports/constants';
import { columnRoles } from '@/app/imports/constants';
import type { CsvImportMapping, ImportPreview } from '@/shared/api/imports/types';
import { formatMonthYear } from '@/shared/utils/months';

/** Returns the role of each mapped column. */
export function getColumnRoles(mapping: CsvImportMapping) {
  const roles = new Map<number, ColumnRole>();
  for (const role of columnRoles) {
    const column = mapping[role.key];
    if (column !== null && column !== undefined && Number(column) >= 0) {
      roles.set(Number(column), role.key);
    }
  }
  return roles;
}

/** Assigns a role to a column; the role leaves any other column, and the column loses its previous role. */
export function assignColumnRole(
  mapping: CsvImportMapping,
  column: number,
  role: ColumnRole | undefined,
): CsvImportMapping {
  const next: CsvImportMapping = { ...mapping };
  for (const { key } of columnRoles) {
    if (Number(next[key]) !== column && key !== role) {
      continue;
    }
    if (key === 'dateColumn') {
      next.dateColumn = -1;
    } else {
      next[key] = null;
    }
  }
  if (role) {
    next[role] = column;
  }
  // A signed amount column replaces separate debit and credit columns and vice versa.
  if (role === 'amountColumn') {
    next.debitColumn = null;
    next.creditColumn = null;
  } else if (role === 'debitColumn' || role === 'creditColumn') {
    next.amountColumn = null;
  }
  return next;
}

/** Creates an empty mapping for the detected format, used when nothing could be proposed. */
export function createEmptyMapping(preview: ImportPreview): CsvImportMapping {
  return {
    amountColumn: null,
    bankReferenceColumn: null,
    bookingTypeColumn: null,
    counterpartyColumn: null,
    counterpartyIbanColumn: null,
    creditColumn: null,
    creditorIdColumn: null,
    dateColumn: -1,
    dateFormat: 'dd.MM.yyyy',
    debitColumn: null,
    decimalSeparator: ',',
    delimiter: preview.delimiter,
    encoding: preview.encoding,
    headerRowIndex: preview.headerRowIndex,
    payerColumn: null,
    purposeColumn: null,
    statusColumn: null,
  };
}

/** Returns why a mapping cannot be confirmed yet, or `undefined` when it is complete. */
export function getMissingMappingFields(mapping: CsvImportMapping) {
  if (Number(mapping.dateColumn) < 0) {
    return 'Choose the booking date column';
  }
  if (mapping.amountColumn === null && mapping.debitColumn === null && mapping.creditColumn === null) {
    return 'Choose the amount column, or debit and credit columns';
  }
  return undefined;
}

/** Formats a month given as ISO date, e.g. `2026-10-01`, as "October 2026". */
export function formatImportMonth(month: string) {
  const [year, monthIndex] = month.split('-').map(Number);
  return formatMonthYear(year, monthIndex);
}
