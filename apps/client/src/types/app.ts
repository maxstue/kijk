// ##### Ts extension types #####
export type Optional<T> = T | undefined | null;
export type Id<T = string> = T;

// eslint-disable-next-line @typescript-eslint/ban-types
export type Autocomplete<Keys extends string> = Keys | (string & {});

export interface ApiResponse<T = unknown> {
  data?: T;
  message?: string;
  state: 'Success' | 'Error';
}

export interface ApiError {
  code: string;
  message: string;
  type: string;
}

export const Allowed_Providers = ['github'] as const;
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

export const CategotyType = {
  DEFAULT: 'Default',
  USER: 'User',
} as const;

export type CategotyType = (typeof CategotyType)[keyof typeof CategotyType];

export interface Category {
  id: Id;
  name: string;
  color: string;
  type: CategotyType;
}

export interface AppUser {
  id: Id;
  name: Optional<string>;
  email: Optional<string>;
  firstTime: Optional<boolean>;
  transactions: Optional<Transaction[]>;
  categories: Optional<Category[]>;
}

export interface User_Metadata {
  user_name: Optional<string>;
}
