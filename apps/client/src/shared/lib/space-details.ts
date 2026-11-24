import { z } from 'zod';

/** Validation of a space's name and description, mirroring the API rules for creating and updating spaces. */
export const spaceDetailsSchema = z.object({
  description: z.string().trim().max(250),
  name: z.string().trim().min(2).max(100),
});

/** Values of a space details form. */
export type SpaceDetailsFormValues = z.infer<typeof spaceDetailsSchema>;
