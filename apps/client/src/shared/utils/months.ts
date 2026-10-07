import { z } from 'zod';

import { AppError } from '@/shared/types/errors/app-error';

/** Zod schema of the English month names used in URLs and the API. */
export const monthSchema = z.enum([
  'january',
  'february',
  'march',
  'april',
  'may',
  'june',
  'july',
  'august',
  'september',
  'october',
  'november',
  'december',
]);

/** An English month name. */
export type Months = z.infer<typeof monthSchema>;

const monthsByIndex = new Map<number, Months>(monthSchema.options.map((month, index) => [index, month]));

/** Formats a month name in the given or the browser's locale. */
export function formatMonth(month: Months, locale?: string) {
  const monthIndex = monthSchema.options.indexOf(month);
  const resolvedLocale = locale ?? navigator.language;
  return new Intl.DateTimeFormat(resolvedLocale, { month: 'long' }).format(new Date(2000, monthIndex));
}

/** Returns all month names in the given or the browser's locale. */
export function monthsLocalized(locale?: string) {
  return monthSchema.options.map((_, idx) =>
    new Intl.DateTimeFormat(locale ?? navigator.language, { month: 'long' }).format(new Date(2000, idx)),
  );
}
/** Returns the month name of a 0-based month index; throws for invalid indexes. */
export function getMonthFromIndex(index: number): Months {
  const month = monthsByIndex.get(index);
  if (month === undefined) {
    throw new AppError({ message: `Invalid month index: ${index}`, type: 'UNKNOWN' });
  }
  return month;
}

/** Returns the month name of a date. */
export const getMonthFromDate = (date: Date) => getMonthFromIndex(date.getMonth());

/**
 * Get the month index from a string.
 *
 * @param month The month string.
 * @returns The month index or throws an error if the month is invalid.
 */
export function getMonthIndexFromString(month: string) {
  if (isMonth(month)) {
    return monthSchema.options.indexOf(month) + 1;
  }
  throw new AppError({ message: `The given string "${month}" is not a valid month`, type: 'UNKNOWN' });
}

const isMonth = (value: string): value is Months => monthSchema.safeParse(value).success;

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
