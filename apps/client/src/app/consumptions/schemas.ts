import { z } from 'zod';

export const ConsumptionCreateSchema = z.object({
  name: z.string().min(2, {
    message: 'Name must be at least 2 characters',
  }),
  value: z.number().min(1, {
    message: 'Value must be at least 1 character',
  }),
  resourceId: z.string().uuid(),
  householdId: z.string().uuid().optional(),
  // date is not allowed to be in the future
  date: z.date().max(new Date(), {
    message: 'Date cannot be in the future',
  }),
});

export type ConsumptionCreateFormSchema = z.input<typeof ConsumptionCreateSchema>;

export const ConsumptionUpdateSchema = z.object({
  id: z.string().uuid(),
  name: z.string().min(2, {
    message: 'Name must be at least 2 characters',
  }),
  value: z.coerce.number().min(1, {
    message: 'Value must be at least 1 character',
  }),
  resourceId: z.string().uuid(),
  householdId: z.string().uuid().optional(),
  // date is not allowed to be in the future
  date: z.date().max(new Date(), {
    message: 'Date cannot be in the future',
  }),
});

export type ConsumptionUpdateFormSchema = z.input<typeof ConsumptionUpdateSchema>;
