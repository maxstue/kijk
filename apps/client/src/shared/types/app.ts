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
  errors: Optional<ErrorDetails[]>;
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

export const CategoryCreatorTypes = {
  DEFAULT: 'Default',
  USER: 'User',
} as const;

export type CategoryCreatorType = (typeof CategoryCreatorTypes)[keyof typeof CategoryCreatorTypes];

export const CategoryTypes = {
  EXPENSE: 'Expense',
  INCOME: 'Income',
  OTHER: 'Other',
} as const;

export type CategoryType = (typeof CategoryTypes)[keyof typeof CategoryTypes];

export interface GroupedCategory extends Record<string, Category[]> {}

export interface Category {
  id: string;
  name: string;
  color: string;
  creatorType: CategoryCreatorType;
  type: CategoryType;
}

export interface AppUser {
  id: string;
  name: Optional<string>;
  email: Optional<string>;
  firstTime: Optional<boolean>;
  transactions: Optional<Transaction[]>;
  categories: Optional<Category[]>;
  useDefaultCategories: Optional<boolean>;
}

export interface User_Metadata {
  user_name: Optional<string>;
}

export const COOKIE_CONSENT_KEY = 'cookie_consent';

export type CookieConsent = 'yes' | 'no' | 'undecided';

export interface Energy {
  id: string;
  name: string;
  description: Optional<string>;
  value: number;
  type: EnergyType;
  date: string;
  householdId: string;
}

export interface EnergyStatsType {
  electricity: EnergyStats;
  gas: EnergyStats;
  water: EnergyStats;
}

export interface EnergyStats {
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

export const EnergyTypes = {
  ELECTRICITY: 'Electricity',
  GAS: 'Gas',
  WATER: 'Water',
} as const;

export type EnergyType = (typeof EnergyTypes)[keyof typeof EnergyTypes];
