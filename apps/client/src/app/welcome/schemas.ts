import { z } from 'zod';

export const userStepSchema = z.object({
  useDefaultResources: z.coerce.boolean().optional(),
  userName: z.string().optional(),
});

export type UserStepFormValues = z.infer<typeof userStepSchema>;
