import { z } from 'zod';

export const householdUpdateSchema = z.object({
  description: z.string().trim().max(250),
  name: z.string().trim().min(2).max(100),
});

export type HouseholdUpdateFormValues = z.infer<typeof householdUpdateSchema>;
