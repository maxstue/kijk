import { z } from 'zod';

export const userStepSchema = z.object({
  userName: z.string().optional(),
  useDefaultResources: z.coerce.boolean().optional(),
});

export type UserStepFormValues = z.infer<typeof userStepSchema>;
