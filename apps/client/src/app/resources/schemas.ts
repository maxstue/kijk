import { z } from 'zod';

/** Validation of the resource forms. */
export const resourceSchema = z.object({
  color: z.string().regex(/^#[\da-f]{6}$/i, {
    message: 'Color must be a valid six-digit hex color',
  }),
  icon: z
    .string()
    .regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/, { message: 'Icon must be valid' })
    .max(50),
  name: z.string().trim().min(2, { message: 'Name must be at least 2 characters' }).max(30, {
    message: 'Name must be at most 30 characters',
  }),
  unitId: z.uuid({ error: 'Unit must be selected' }),
});

/** Values of the resource forms. */
export type ResourceFormValues = z.infer<typeof resourceSchema>;
