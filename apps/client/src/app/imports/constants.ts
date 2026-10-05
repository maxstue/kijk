import type { CsvImportMapping, ImportJobStatus, PurposeRetention } from '@/shared/api/imports/types';

/** Mapping fields that point to a column, with the label shown in the column dropdown. */
export const columnRoles = [
  { key: 'dateColumn', label: 'Booking date' },
  { key: 'amountColumn', label: 'Amount' },
  { key: 'debitColumn', label: 'Debit (outgoing)' },
  { key: 'creditColumn', label: 'Credit (incoming)' },
  { key: 'counterpartyColumn', label: 'Payee / counterparty' },
  { key: 'payerColumn', label: 'Payer (incoming payments)' },
  { key: 'purposeColumn', label: 'Purpose' },
  { key: 'counterpartyIbanColumn', label: 'Counterparty IBAN' },
  { key: 'creditorIdColumn', label: 'Creditor ID' },
  { key: 'bankReferenceColumn', label: 'Booking ID of the bank' },
  { key: 'statusColumn', label: 'Status (marks pending)' },
  { key: 'bookingTypeColumn', label: 'Booking type (e.g. Lastschrift)' },
] as const satisfies ReadonlyArray<{ key: keyof CsvImportMapping; label: string }>;

/** A mapping field that points to a column. */
export type ColumnRole = (typeof columnRoles)[number]['key'];

/** Select value for a column that is not imported. */
export const ignoredColumn = 'ignore';

/** Supported date formats; mirrors the API. */
export const dateFormats = ['dd.MM.yyyy', 'dd.MM.yy', 'yyyy-MM-dd', 'dd/MM/yyyy', 'MM/dd/yyyy', 'd.M.yyyy'] as const;

/** Supported delimiters with labels. */
export const delimiters = [
  { label: 'Semicolon ;', value: ';' },
  { label: 'Comma ,', value: ',' },
  { label: 'Tab', value: '\t' },
  { label: 'Pipe |', value: '|' },
] as const;

/** Supported encodings with labels. */
export const encodings = [
  { label: 'UTF-8', value: 'utf-8' },
  { label: 'Windows-1252 / ISO-8859-1', value: 'windows-1252' },
] as const;

/** Labels of the purpose retention settings. */
export const purposeRetentionLabels: Record<PurposeRetention, string> = {
  Keep: 'Keep the cleaned purpose',
  Remove: 'Do not store the purpose',
  Truncate: 'Keep only the first 40 characters',
};

/** Labels of the import states. */
export const importStatusLabels: Record<ImportJobStatus, string> = {
  Analyzing: 'Detecting format',
  Cancelled: 'Cancelled',
  Done: 'Imported',
  Failed: 'Failed',
  NeedsMapping: 'Waiting for column mapping',
  NeedsReview: 'Waiting for review',
  Pending: 'Queued',
  Reading: 'Reading file',
};
