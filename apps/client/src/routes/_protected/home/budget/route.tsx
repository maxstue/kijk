import { FileRoute } from '@tanstack/react-router';
import { z } from 'zod';

import { Months, months } from '@/shared/types/app';

const searchSchema = z.object({
  month: z
    .string()
    .transform((x) => x as Months)
    .optional()
    .catch(months[new Date().getMonth()] as Months),
  year: z.number().optional().catch(new Date().getFullYear()),
});

export const Route = new FileRoute('/_protected/home/budget').createRoute({
  validateSearch: searchSchema,
});
