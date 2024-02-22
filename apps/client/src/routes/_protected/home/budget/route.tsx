import { createFileRoute } from '@tanstack/react-router';
import { z } from 'zod';

import { NotFound } from '@/shared/components/not-found';
import { Months, months } from '@/shared/types/app';

const searchSchema = z.object({
  month: z
    .string()
    .transform((x) => x as Months)
    .optional()
    .catch(months[new Date().getMonth()] as Months),
  year: z.number().optional().catch(new Date().getFullYear()),
});

export const Route = createFileRoute('/_protected/home/budget')({
  validateSearch: searchSchema,
  notFoundComponent: NotFound,
});
