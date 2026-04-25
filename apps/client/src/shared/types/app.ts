// Do not add any other lines of code to this file!
// oxlint-disable-next-line no-unassigned-import
import '@total-typescript/ts-reset';
import type { components } from '@/shared/api/generated/kijk';

// ##### Ts extension types #####
export type Optional<T> = T | undefined;
export type Nullable<T> = T | null;
export type Nullish<T> = T | undefined | null;

export type Autocomplete<TOptions extends string> = TOptions | (string & {});

export type ApiError = components['schemas']['Problem'] & {
  correlationId?: string;
  errorType?: string;
  errors?: Optional<ErrorDetails[]>;
  requestId?: string;
  timestamp?: string;
  traceId?: string;
};

export interface ErrorDetails {
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

const monthFormatter = new Intl.DateTimeFormat('en-US', { month: 'long' });
export const months = Array.from({ length: 12 }, (_, index) =>
  monthFormatter.format(new Date(2000, index)).toLowerCase(),
);

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
