import { z } from 'zod';

export const userUpdateSchema = z.object({
  useDefaultResources: z.boolean().optional().default(false),
  userName: z.string().optional(),
});

export type UserUpdateFormValues = z.infer<typeof userUpdateSchema>;
