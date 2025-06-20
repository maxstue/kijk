import type { Months } from '@/shared/types/app';
import { months } from '@/shared/types/app';
import { AppError } from '@/shared/types/errors';

export function formatStringToCurrency(value: string | number) {
  const amount = typeof value === 'string' ? Number.parseFloat(value) : value;
  return new Intl.NumberFormat('de-DE', {
    style: 'currency',
    currency: 'EUR',
  }).format(amount);
}

export function formatStringDateToOnlyDateString(value: string) {
  const date = new Date(value);
  const year = date.getFullYear();
  const day = `${date.getDate() < 10 ? `0${date.getDate()}` : date.getDate()}`;
  const month = `${date.getMonth() + 1 < 10 ? `0${date.getMonth() + 1}` : date.getMonth() + 1}`;

  return year.toString() + '-' + month + '-' + day;
}

/**
 * Get the month index from a string.
 *
 * @param month The month string.
 * @returns The month index or throws an error if the month is invalid.
 */
export function getMonthIndexFromString(month: string) {
  if (isMonth(month)) {
    return months.indexOf(month) + 1;
  }
  throw new AppError({ type: 'VALIDATION', message: `The given string "${month}" is not a valid month` });
}

const isMonth = (b: string): b is Months => {
  return months.includes(b as Months);
};
