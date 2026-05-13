export const months = [
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

// TODO kann ich months als zod array machen wodurch ich parse functions und types automatisch bekomme?
export type Months = (typeof months)[number];

export function formatMonth(month: Months, locale?: string) {
  const monthIndex = months.indexOf(month);
  const resolvedLocale = locale ?? navigator.language;
  return new Intl.DateTimeFormat(resolvedLocale, { month: 'long' }).format(new Date(2000, monthIndex));
}

export function monthsLocalized(locale?: string) {
  return months.map((_, idx) =>
    new Intl.DateTimeFormat(locale ?? navigator.language, { month: 'long' }).format(new Date(2000, idx)),
  );
}
