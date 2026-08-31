import { z } from 'zod';

export const periods = ['Month', 'Quarter', 'Year'] as const;

export const consumptionLimitSchema = z.object({
  active: z.boolean(),
  description: z.string().trim().max(250, 'Description must be at most 250 characters'),
  limit: z.number().positive('Limit must be greater than zero'),
  name: z.string().trim().min(2, 'Name must be at least 2 characters').max(100, 'Name must be at most 100 characters'),
  period: z.enum(periods),
  resourceId: z.string().min(1, 'Select a resource'),
});

export type ConsumptionLimitFormValues = z.infer<typeof consumptionLimitSchema>;
