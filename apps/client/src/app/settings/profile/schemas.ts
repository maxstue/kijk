import { z } from 'zod';

export const userUpdateSchema = z.object({
  userName: z.string().optional(),
  useDefaultResources: z.boolean().default(false).optional(),
});

export type UserUpdateFormValues = z.infer<typeof userUpdateSchema>;
