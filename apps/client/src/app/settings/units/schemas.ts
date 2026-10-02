import { z } from 'zod';

/** Validation of the create-unit form. */
export const createUnitSchema = z.object({
  conversionFactor: z.string().refine((value) => Number.isFinite(Number(value)) && Number(value) > 0, {
    message: 'Conversion factor must be greater than zero',
  }),
  name: z.string().trim().min(1, 'Name is required').max(50),
  referenceUnitId: z.string().uuid('Reference unit must be selected'),
  symbol: z.string().trim().min(1, 'Symbol is required').max(20),
});

/** Validation of the update-unit form. */
export const updateUnitSchema = createUnitSchema;

/** Values of the create-unit form. */
export type CreateUnitFormValues = z.infer<typeof createUnitSchema>;
/** Values of the update-unit form. */
export type UpdateUnitFormValues = z.infer<typeof updateUnitSchema>;
