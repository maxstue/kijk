// ##### Ts extension types #####
export type Optional<T> = T | undefined;
export type Nullable<T> = T | null;
export type Nullish<T> = T | undefined | null;

export type Autocomplete<TOptions extends string> = TOptions | (string & {});

export interface ApiError {
  type: string;
  title: string;
  status: number;
  detail: string;
  instance: string;
  errors: Optional<Array<ErrorDetails>>;
  traceId: string;
  requestId: string;
}

export interface ErrorDetails {
  type: string;
  code: string;
  description: string;
}

export const Allowed_Providers = ['Github'] as const;
export type AllowedProviders = (typeof Allowed_Providers)[number];

export interface Transaction {
  id: string;
  name: string;
  amount: number;
  type: TransactionType;
  executedAt: string;
  category?: Category;
}

export const TransactionType = {
  EXPENSE: 'Expense',
  INCOME: 'Income',
} as const;

export type TransactionType = (typeof TransactionType)[keyof typeof TransactionType];

export const months = [
  'January',
  'February',
  'March',
  'April',
  'May',
  'June',
  'July',
  'August',
  'September',
  'October',
  'November',
  'December',
] as const;

export type Months = (typeof months)[number];

export const CategoryTypes = {
  EXPENSE: 'Expense',
  INCOME: 'Income',
  OTHER: 'Other',
} as const;

export type CategoryType = (typeof CategoryTypes)[keyof typeof CategoryTypes];

export interface GroupedCategory extends Record<string, Array<Category>> {}

export interface Category {
  id: string;
  name: string;
  color: string;
  type: CategoryType;
}

export interface AppUser {
  id: string;
  name: Optional<string>;
  email: Optional<string>;
  firstTime: Optional<boolean>;
  resourceTypes: Optional<Array<Resource>>;
  useDefaultResources: Optional<boolean>;
}

export interface User_Metadata {
  user_name: Optional<string>;
}

export const CORRELATION_ID_HEADER = 'X-Correlation-Id';
export const COOKIE_CONSENT_KEY = 'cookie_consent';

export type CookieConsent = 'accepted' | 'declined' | 'undecided';

export interface Consumption {
  id: string;
  name: string;
  description: Optional<string>;
  value: number;
  resource: Resource;
  date: string;
}

export const ValueTypes = {
  ABSOLUTE: 'Absolute',
  RELATIVE: 'Relative',
} as const;
export type ValueType = (typeof ValueTypes)[keyof typeof ValueTypes];

export interface ConsumptionsStatsType {
  stats: Array<ConsumptionsStats>;
}

export interface ConsumptionsStats {
  type: ResourceStats;
  monthTotal: number;
  yearTotal: number;
  yearAverage: number;
  yearMin: number;
  yearMax: number;
  comparisonYear: number;
  comparisonYearDiff: number;
  comparisonMonth: number;
  comparisonMonthDiff: number;
}

export interface ResourceStats {
  name: string;
  unit: string;
  color: string;
}

export const CreatorTypes = {
  DEFAULT: 'Default',
  USER: 'User',
} as const;
export type CreatorType = (typeof CreatorTypes)[keyof typeof CreatorTypes];

export interface Resource {
  id: string;
  name: string;
  unit: string;
  color: string;
  creator: CreatorType;
}

export interface Years {
  years: Array<number>;
}
