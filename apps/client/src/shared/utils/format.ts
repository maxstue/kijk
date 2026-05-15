/**
 * Format a string or number to a localized currency format (e.g. "€1,234.56" for German locale).
 *
 * @param value A string or number representing the amount to be formatted as currency.
 * @returns A string representing the formatted currency value according to the German locale.
 */
export function formatStringToCurrency(value: string | number) {
  const amount = typeof value === 'string' ? Number.parseFloat(value) : value;
  return new Intl.NumberFormat('de-DE', {
    currency: 'EUR',
    style: 'currency',
  }).format(amount);
}

/**
 * Format a string date to only the date part in the format "YYYY-MM-DD".
 *
 * @param value A string representing a date, e.g. "2024-01-01T00:00:00.000Z"
 * @returns A string representing only the date part, e.g. "2024-01-01"
 */
export function formatStringDateToOnlyDateString(value: string) {
  const date = new Date(value);
  const year = date.getFullYear();
  const day = `${date.getDate() < 10 ? `0${date.getDate()}` : date.getDate()}`;
  const month = `${date.getMonth() + 1 < 10 ? `0${date.getMonth() + 1}` : date.getMonth() + 1}`;

  return year.toString() + '-' + month + '-' + day;
}
