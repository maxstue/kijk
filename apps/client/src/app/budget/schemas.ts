import { z } from 'zod';

import { TransactionType } from '@/types/app';

export const transactionSchema = z.object({
  name: z.string().min(2, {
    message: 'Name must be at least 2 characters',
  }),
  amount: z.coerce.number().min(1, {
    message: 'Amount must be at least 1 character',
  }),
  type: z.enum([TransactionType.EXPENSE, TransactionType.INCOME], {
    description: 'The type needs to be "Expense" or "Income"',
  }),
  categoryId: z.string().uuid().optional(),
  executedAt: z.date(),
});

export type TransactionFormValues = z.infer<typeof transactionSchema>;
