import { lazyRouteComponent, Route } from '@tanstack/react-router';
import * as z from 'zod';

import { authenticatedRoute } from '@/routes/root-route';
import { Months } from '@/types/app';

const searchSchema = z.object({
  month: z
    .string()
    .transform((x) => x as Months)
    .optional(),
  year: z.number().optional(),
});

export type BudgetSearch = z.infer<typeof searchSchema>;

export const budgetRoute = new Route({
  getParentRoute: () => authenticatedRoute,
  path: 'budget',
  validateSearch: searchSchema,
  component: lazyRouteComponent(() => import('./budget-page'), 'BudgetPage'),
});
