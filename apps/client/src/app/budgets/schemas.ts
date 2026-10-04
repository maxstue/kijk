import { z } from 'zod';

/** Validation of the budget form. */
export const budgetSchema = z.object({
  active: z.boolean(),
  amount: z.number().positive('Amount must be greater than zero'),
  categoryId: z.string().min(1, 'Select a category'),
});

/** Values of the budget form. */
export type BudgetFormValues = z.infer<typeof budgetSchema>;

/** Validation of the custom category form. */
export const categorySchema = z.object({
  color: z.string().regex(/^#[0-9a-fA-F]{6}$/, 'Pick a color'),
  kind: z.enum(['Expense', 'Income']),
  name: z.string().trim().min(2, 'Name must be at least 2 characters').max(50, 'Name must be at most 50 characters'),
});

/** Values of the custom category form. */
export type CategoryFormValues = z.infer<typeof categorySchema>;
