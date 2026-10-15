/** The English month names used in URLs and the API, in calendar order. */
export const MONTHS = [
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
] as const;

/** An English month name. */
export type Months = (typeof MONTHS)[number];
