// ##### Ts extension types #####
export type Optional<T> = T | undefined | null;
export type Id<T = string> = T;

export interface ApiResponse<T = unknown> {
  data?: T;
  message?: string;
  state: 'Success' | 'Error';
}

export interface Transaction {
  id: string;
  name: string;
  amount: number;
  type: TransactionType;
  executedAt: string;
  categories?: Category[];
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

export interface Category {
  id: Id;
  name: string;
  color: string;
  transactions?: Transaction[];
  user?: User;
  userId: string;
}

export interface User {
  id?: Id | null;
  name?: string | null;
  email?: string | null;
  given_name: string | null;
  family_name: string | null;
  picture?: string | null;
}
