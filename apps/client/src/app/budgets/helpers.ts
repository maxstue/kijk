/** Formats a month (1-12) as the ISO date of its first day, e.g. `2026-10-01`. */
export function toMonthStart(year: number, month: number) {
  return `${year}-${String(month).padStart(2, '0')}-01`;
}

/** Converts an API decimal, which may be serialized as a string, to a number. */
export function toAmount(value: number | string | null | undefined) {
  return value === null || value === undefined ? 0 : Number(value);
}
