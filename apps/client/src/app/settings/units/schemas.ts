import { z } from 'zod';

export const createUnitSchema = z.object({
  conversionFactor: z.string().refine((value) => Number.isFinite(Number(value)) && Number(value) > 0, {
    message: 'Conversion factor must be greater than zero',
  }),
  name: z.string().trim().min(1, 'Name is required').max(50),
  referenceUnitId: z.string().uuid('Reference unit must be selected'),
  symbol: z.string().trim().min(1, 'Symbol is required').max(20),
});

export const updateUnitSchema = createUnitSchema;

export type CreateUnitFormValues = z.infer<typeof createUnitSchema>;
export type UpdateUnitFormValues = z.infer<typeof updateUnitSchema>;
