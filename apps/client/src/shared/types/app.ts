// Do not add any other lines of code to this file!
// oxlint-disable-next-line no-unassigned-import
import '@total-typescript/ts-reset';
import type { components } from '@/shared/api/generated/kijk';

// ##### Ts extension types #####
export type Optional<T> = T | undefined;
export type Nullable<T> = T | null;
export type Nullish<T> = T | undefined | null;

export type Autocomplete<TOptions extends string> = TOptions | (string & {});

export type ApiProblemDetails = components['schemas']['Problem'] & {
  correlationId?: string;
  errorType?: string;
  errors?: Optional<ApiProblemDetailsError[]>;
  requestId?: string;
  timestamp?: string;
  traceId?: string;
};

export interface ApiProblemDetailsError {
  type: string;
  code: string;
  description: string;
}

export const Allowed_Providers = ['Github'] as const;
export type AllowedProviders = (typeof Allowed_Providers)[number];

export const TransactionType = {
  EXPENSE: 'Expense',
  INCOME: 'Income',
} as const;

export type TransactionType = (typeof TransactionType)[keyof typeof TransactionType];

export function formatMonth(month: Months, locale?: string) {
  const monthIndex = months.indexOf(month);
  const resolvedLocale = locale ?? navigator.language ?? 'en-US';
  return new Intl.DateTimeFormat(resolvedLocale, { month: 'long' }).format(new Date(2000, monthIndex));
}

export function monthsLocalized(locale?: string) {
  return months.map((_, idx) =>
    new Intl.DateTimeFormat(locale ?? navigator.language ?? 'en-US', { month: 'long' }).format(new Date(2000, idx)),
  );
}

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

export type Months = (typeof months)[number];

export type AppUser = components['schemas']['UserResponse'];

export interface User_Metadata {
  user_name: Optional<string>;
}

export const CORRELATION_ID_HEADER = 'X-Correlation-Id';
export const COOKIE_CONSENT_KEY = 'cookie_consent';

export type CookieConsent = 'accepted' | 'declined' | 'undecided';

export type Consumption = components['schemas']['ConsumptionResponse'];

export const ValueTypes = {
  ABSOLUTE: 'Absolute',
  RELATIVE: 'Relative',
} as const;
export type ValueType = (typeof ValueTypes)[keyof typeof ValueTypes];

export type ConsumptionsStatsType = components['schemas']['GetStatsConsumptionsResponseWrapper'];

export type ConsumptionsStats = components['schemas']['ConsumptionStatsResponse'];

export type ResourceStats = components['schemas']['ConsumptionStatsResourceResponse'];

export const CreatorTypes = {
  SYSTEM: 'System',
  USER: 'User',
} as const;
export type CreatorType = (typeof CreatorTypes)[keyof typeof CreatorTypes];

export type Resource = components['schemas']['ResourceResponse'];

export type Years = components['schemas']['GetYearsConsumptionQueryResponse'];
