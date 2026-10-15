import { MONTHS, type Months } from '@kijk/api/months';
import { z } from 'zod';

import { AppError } from '@/shared/types/errors/app-error';

/** Zod schema of the English month names used in URLs and the API. */
export const monthSchema = z.enum(MONTHS);

/** An English month name. */
export type { Months } from '@kijk/api/months';

const monthFormatter = new Intl.DateTimeFormat(undefined, { month: 'long' });

/** Formats a month name in the given or the browser's locale. */
export function formatMonth(month: Months, locale?: string) {
  const formatter = locale ? new Intl.DateTimeFormat(locale, { month: 'long' }) : monthFormatter;
  return formatter.format(new Date(2000, MONTHS.indexOf(month)));
}
/** Returns the month name of a 0-based month index; throws for invalid indexes. */
export function getMonthFromIndex(index: number): Months {
  const month = MONTHS[index];
  if (month === undefined) {
    throw new AppError({ message: `Invalid month index: ${index}`, type: 'UNKNOWN' });
  }
  return month;
}

/** Returns the month name of a date. */
export const getMonthFromDate = (date: Date) => getMonthFromIndex(date.getMonth());

/**
 * Gets the one-based month number from an English month name.
 *
 * @param month The month string.
 * @returns The month number (1-12), or throws if the month is invalid.
 */
export function getMonthNumber(month: string) {
  const parsed = monthSchema.safeParse(month);
  if (parsed.success) {
    return MONTHS.indexOf(parsed.data) + 1;
  }
  throw new AppError({ message: `The given string "${month}" is not a valid month`, type: 'UNKNOWN' });
}

const monthYearFormatter = new Intl.DateTimeFormat(undefined, { month: 'long', year: 'numeric' });

/** Formats a month (1-12) and year in the browser's locale, e.g. "October 2026". */
export function formatMonthYear(year: number, month: number) {
  return monthYearFormatter.format(new Date(year, month - 1));
}

/** Shifts a month (1-12) by `delta` months across year boundaries. */
export function shiftMonth(year: number, month: number, delta: number) {
  const date = new Date(year, month - 1 + delta, 1);
  return { month: date.getMonth() + 1, year: date.getFullYear() };
}
