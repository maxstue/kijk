// ##### Ts extension types #####
export type Optional<T> = T | undefined | null;
export type Id<T = string> = T;

export type Transaction = {
  id: string;
  name: string;
  amount: number;
  type: TransactionType;
};

export const TransactionType = {
  EXPENSE: 'EXPENSE',
  INCOME: 'INCOME',
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
