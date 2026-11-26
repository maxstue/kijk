import { z } from 'zod';

import { userNameSchema } from '@/shared/lib/user-name';

/** Validation of the profile form. */
export const userUpdateSchema = z.object({
  defaultSpaceId: z.string().nullable(),
  useDefaultResources: z.boolean().optional().default(false),
  useExternalProfile: z.boolean().optional().default(false),
  userName: userNameSchema,
});

/** Values of the profile form. */
export type UserUpdateFormValues = z.infer<typeof userUpdateSchema>;
