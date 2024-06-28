import { z } from 'zod';

import { CategoryTypes } from '@/shared/types/app';

export const categorySchema = z.object({
  name: z.string().min(2, {
    message: 'Name must be at least 2 characters',
  }),
  type: z.enum([CategoryTypes.INCOME, CategoryTypes.EXPENSE, CategoryTypes.OTHER], {
    description: 'The type needs to be "Income" or "Expense" or "Other"',
  }),
  color: z
    .string()
    .min(1, {
      message: 'Color must be set',
    })
    .refine(startsWithHash, { message: 'The color need to start with a "#"' }),
});

function startsWithHash(value: string) {
  return value.startsWith('#');
}

export type CategoryFormValues = z.infer<typeof categorySchema>;
