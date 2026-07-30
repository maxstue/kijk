import { z } from 'zod';

export const resourceSchema = z.object({
  color: z.string().regex(/^#[\da-f]{6}$/i, {
    message: 'Color must be a valid six-digit hex color',
  }),
  name: z.string().trim().min(2, { message: 'Name must be at least 2 characters' }).max(30, {
    message: 'Name must be at most 30 characters',
  }),
  unit: z.string().trim().min(1, { message: 'Unit must be set' }).max(10, {
    message: 'Unit must be at most 10 characters',
  }),
});

export type ResourceFormValues = z.infer<typeof resourceSchema>;
