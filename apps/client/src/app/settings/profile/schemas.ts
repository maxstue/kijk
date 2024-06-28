import { z } from 'zod';

export const userUpdateSchema = z.object({
  userName: z.string().optional(),
  useDefaultCategories: z.coerce.boolean().optional(),
});

export type UserUpdateFormValues = z.infer<typeof userUpdateSchema>;
