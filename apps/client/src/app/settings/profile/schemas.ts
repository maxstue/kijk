import { z } from 'zod';

export const userUpdateSchema = z.object({
  userName: z.string().optional(),
  useDefaultResources: z.boolean().optional().default(false),
});

export type UserUpdateFormValues = z.infer<typeof userUpdateSchema>;
