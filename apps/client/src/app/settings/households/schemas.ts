import { z } from 'zod';

/** Validation of the household details form. */
export const householdUpdateSchema = z.object({
  description: z.string().trim().max(250),
  name: z.string().trim().min(2).max(100),
});

/** Values of the household details form. */
export type HouseholdUpdateFormValues = z.infer<typeof householdUpdateSchema>;
