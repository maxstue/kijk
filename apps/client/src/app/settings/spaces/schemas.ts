import { z } from 'zod';

/** Validation of the space details form. */
export const spaceUpdateSchema = z.object({
  description: z.string().trim().max(250),
  name: z.string().trim().min(2).max(100),
});

/** Values of the space details form. */
export type SpaceUpdateFormValues = z.infer<typeof spaceUpdateSchema>;
