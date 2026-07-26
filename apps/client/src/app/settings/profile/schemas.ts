import { z } from 'zod';

export const userUpdateSchema = z.object({
  householdName: z.string().trim().min(2).max(100),
  useDefaultResources: z.boolean().optional().default(false),
  useExternalProfile: z.boolean().optional().default(false),
  userName: z.string().trim().min(2).max(100),
});

export type UserUpdateFormValues = z.infer<typeof userUpdateSchema>;
