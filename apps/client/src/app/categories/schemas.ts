import { z } from 'zod';

/** Validation of the custom category form. */
export const categorySchema = z.object({
  color: z.string().regex(/^#[0-9a-fA-F]{6}$/, 'Pick a color'),
  kind: z.enum(['Expense', 'Income']),
  name: z.string().trim().min(2, 'Name must be at least 2 characters').max(50, 'Name must be at most 50 characters'),
});

/** Values of the custom category form. */
export type CategoryFormValues = z.infer<typeof categorySchema>;
