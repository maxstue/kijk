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

/** Name of an account with the last four characters of its IBAN, e.g. "Checking (…1234)". */
export function accountLabel(account: { name: string; ibanLast4?: string | null }) {
  return account.ibanLast4 ? `${account.name} (…${account.ibanLast4})` : account.name;
}
