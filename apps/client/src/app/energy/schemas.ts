import { z } from 'zod';

import { EnergyTypes } from '@/shared/types/app';

export const energySchema = z.object({
  name: z.string().min(2, {
    message: 'Name must be at least 2 characters',
  }),
  value: z.coerce.number().min(1, {
    message: 'Value must be at least 1 character',
  }),
  type: z.enum([EnergyTypes.ELECTRICITY, EnergyTypes.GAS, EnergyTypes.WATER], {
    description: 'The type needs to be either "Electricity", "Gas", or "Water"',
  }),
  householdId: z.string().uuid().optional(),
  date: z.date(),
});

export type EnergyFormSchema = z.infer<typeof energySchema>;
