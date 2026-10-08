import { z } from 'zod';

/** Validation of the budget form. */
export const budgetSchema = z.object({
  active: z.boolean(),
  amount: z.number().positive('Amount must be greater than zero'),
  categoryId: z.string().min(1, 'Select a category'),
  visibility: z.enum(['Shared', 'Private']),
});

/** Values of the budget form. */
export type BudgetFormValues = z.infer<typeof budgetSchema>;
