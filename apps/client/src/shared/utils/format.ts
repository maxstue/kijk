const currencyFormatter = new Intl.NumberFormat('de-DE', { currency: 'EUR', style: 'currency' });

/**
 * Format a string or number to a localized currency format (e.g. "€1,234.56" for German locale).
 *
 * @param value A string or number representing the amount to be formatted as currency.
 * @returns A string representing the formatted currency value according to the German locale.
 */
export function formatStringToCurrency(value: string | number) {
  const amount = typeof value === 'string' ? Number.parseFloat(value) : value;
  return currencyFormatter.format(amount);
}

/** Name of an account with the last four characters of its IBAN, e.g. "Checking (…1234)". */
export function accountLabel(account: { name: string; ibanLast4?: string | null }) {
  return account.ibanLast4 ? `${account.name} (…${account.ibanLast4})` : account.name;
}

const calendarDateFormatter = new Intl.DateTimeFormat(undefined, { dateStyle: 'medium' });
const dateTimeFormatter = new Intl.DateTimeFormat(undefined, { dateStyle: 'medium', timeStyle: 'short' });
const shortMonthFormatter = new Intl.DateTimeFormat(undefined, { month: 'short', year: '2-digit' });

/** Formats a date-only API value in local calendar time without shifting its calendar day. */
export function formatCalendarDate(value: string) {
  return calendarDateFormatter.format(new Date(`${value}T00:00:00`));
}

/** Formats an API timestamp in the browser's locale and timezone. */
export function formatDateTime(value: string) {
  return dateTimeFormatter.format(new Date(value));
}

/** Formats a date-only month marker without shifting its calendar month. */
export function formatShortMonth(value: string) {
  return shortMonthFormatter.format(new Date(`${value}T00:00:00`));
}
