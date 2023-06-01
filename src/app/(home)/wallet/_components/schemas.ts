import { z } from 'zod';

export const transactionSchema = z.object({
  name: z.string().min(2, {
    message: 'Name must be at least 2 characters',
  }),
  amount: z.string().min(1, {
    message: 'Amount must be at least 1 character',
  }),
  type: z.string().refine(isTransactionType, { message: 'The type needs to be "Expense" or "Income"' }),
  categories: z.any().array().optional(),
});

export function isTransactionType(value: string): value is TransactionType {
  return Object.keys(TransactionType).includes(value as TransactionType);
}

export type TransactionFormValues = z.infer<typeof transactionSchema>;

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
