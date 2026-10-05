import { z } from 'zod';

/** Validation of the profile form. */
export const userUpdateSchema = z.object({
  spaceName: z.string().trim().min(2).max(100),
  useDefaultResources: z.boolean().optional().default(false),
  useExternalProfile: z.boolean().optional().default(false),
  userName: z.string().trim().min(2).max(100),
});

/** Values of the profile form. */
export type UserUpdateFormValues = z.infer<typeof userUpdateSchema>;
