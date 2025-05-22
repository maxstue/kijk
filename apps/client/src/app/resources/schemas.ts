import { z } from 'zod';

export const resourceSchema = z.object({
  name: z.string().min(2, {
    message: 'Name must be at least 2 characters',
  }),
  unit: z.string().min(1, {
    message: 'Unit must be set',
  }),
  color: z
    .string()
    .min(1, {
      message: 'Color must be set',
    })
    .refine(startsWithHash, { message: 'The color need to start with a "#"' }),
});

function startsWithHash(value: string) {
  return value.startsWith('#');
}

export type ResourceFormValues = z.infer<typeof resourceSchema>;
