import { z } from 'zod';

import { AppError } from '@/shared/types/errors/app-error';

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

export type Months = z.infer<typeof monthSchema>;

const monthsByIndex = new Map<number, Months>(monthSchema.options.map((month, index) => [index, month]));

export function formatMonth(month: Months, locale?: string) {
  const monthIndex = monthSchema.options.indexOf(month);
  const resolvedLocale = locale ?? navigator.language;
  return new Intl.DateTimeFormat(resolvedLocale, { month: 'long' }).format(new Date(2000, monthIndex));
}

export function monthsLocalized(locale?: string) {
  return monthSchema.options.map((_, idx) =>
    new Intl.DateTimeFormat(locale ?? navigator.language, { month: 'long' }).format(new Date(2000, idx)),
  );
}
export function getMonthFromIndex(index: number): Months {
  const month = monthsByIndex.get(index);
  if (month === undefined) {
    throw new AppError({ message: `Invalid month index: ${index}`, type: 'UNKNOWN' });
  }
  return month;
}

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
