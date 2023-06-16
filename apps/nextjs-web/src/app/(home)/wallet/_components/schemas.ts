import { z } from 'zod';

import { TransactionType } from '@/types/app';

export const transactionSchema = z.object({
  name: z.string().min(2, {
    message: 'Name must be at least 2 characters',
  }),
  amount: z.string().min(1, {
    message: 'Amount must be at least 1 character',
  }),
  type: z.string().refine(isTransactionType, { message: 'The type needs to be "Expense" or "Income"' }),
  categories: z.any().array().optional(),
  executed_At: z.date().optional(),
});

export function isTransactionType(value: string): value is TransactionType {
  return Object.keys(TransactionType).includes(value as TransactionType);
}

export type TransactionFormValues = z.infer<typeof transactionSchema>;
