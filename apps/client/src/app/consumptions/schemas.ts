import { z } from 'zod';
import { ValueTypes } from '@/shared/types/app';

export const consumptionCreateSchema = z.object({
  name: z.string().min(2, {
    message: 'Name must be at least 2 characters',
  }),
  value: z.number().min(1, {
    message: 'Value must be at least 1 character',
  }),
  valueType: z.enum(ValueTypes).default('Absolute'),
  resourceId: z.uuid(),
  householdId: z.uuid().optional(),
  // date is not allowed to be in the future
  date: z.date().max(new Date(), {
    message: 'Date cannot be in the future',
  }),
});

export type ConsumptionCreateFormSchema = z.input<typeof consumptionCreateSchema>;

export const consumptionUpdateSchema = z.object({
  id: z.uuid(),
  name: z.string().min(2, {
    message: 'Name must be at least 2 characters',
  }),
  value: z.number().min(1, {
    message: 'Value must be at least 1 character',
  }),
  valueType: z.enum(ValueTypes).default('Absolute'),
  resourceId: z.uuid(),
  householdId: z.uuid().optional(),
  // date is not allowed to be in the future
  date: z.date().max(new Date(), {
    message: 'Date cannot be in the future',
  }),
});

export type ConsumptionUpdateFormSchema = z.input<typeof consumptionUpdateSchema>;
