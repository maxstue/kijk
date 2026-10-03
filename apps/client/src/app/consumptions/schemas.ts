import { z } from 'zod';

import { ValueTypes } from '@/shared/types/domain';

/** Validation of the create-consumption form. */
export const consumptionCreateSchema = z.object({
  name: z.string().min(2, {
    message: 'Name must be at least 2 characters',
  }),
  value: z.number().min(1, {
    message: 'Value must be at least 1 character',
  }),
  valueType: z.enum(ValueTypes).default('Absolute'),
  startsNewMeterSegment: z.boolean().default(false),
  resourceId: z.uuid(),
  householdId: z.uuid().optional(),
  // Date is not allowed to be in the future
  date: z.date().max(new Date(), {
    message: 'Date cannot be in the future',
  }),
});

/** Input values of the create-consumption form. */
export type ConsumptionCreateFormSchema = z.input<typeof consumptionCreateSchema>;

/** Validation of the update-consumption form. */
export const consumptionUpdateSchema = z.object({
  id: z.uuid(),
  name: z.string().min(2, {
    message: 'Name must be at least 2 characters',
  }),
  value: z.number().min(1, {
    message: 'Value must be at least 1 character',
  }),
  valueType: z.enum(ValueTypes).default('Absolute'),
  startsNewMeterSegment: z.boolean().default(false),
  resourceId: z.uuid(),
  householdId: z.uuid().optional(),
  // Date is not allowed to be in the future
  date: z.date().max(new Date(), {
    message: 'Date cannot be in the future',
  }),
});

/** Input values of the update-consumption form. */
export type ConsumptionUpdateFormSchema = z.input<typeof consumptionUpdateSchema>;
