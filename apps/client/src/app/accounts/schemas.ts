import { z } from 'zod';

/** Validation of the account form. */
export const accountSchema = z.object({
  ibanLast4: z.union([z.literal(''), z.string().regex(/^[0-9A-Za-z]{4}$/, 'Enter the last four characters')]),
  name: z.string().trim().min(1, 'Name is required').max(100, 'Name must be at most 100 characters'),
  visibility: z.enum(['Shared', 'Private']),
});

/** Values of the account form. */
export type AccountFormValues = z.infer<typeof accountSchema>;
