import { z } from 'zod';

export const userStepSchema = z.object({
  userName: z.string().optional(),
  useDefaultCategories: z.coerce.boolean().optional(),
});

export type UserStepFormValues = z.infer<typeof userStepSchema>;
