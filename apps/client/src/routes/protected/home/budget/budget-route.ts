import { lazyRouteComponent, Route } from '@tanstack/react-router';
import { z } from 'zod';

import { AppRouteError } from '@/components/app-route-error';
import { homeRoute } from '@/routes/protected/home/home-route';
import { Months, months } from '@/types/app';

const searchSchema = z.object({
  month: z
    .string()
    .transform((x) => x as Months)
    .optional()
    .catch(months[new Date().getMonth()] as Months),
  year: z.number().optional().catch(new Date().getFullYear()),
});

export type BudgetSearch = z.infer<typeof searchSchema>;

export const budgetRoute = new Route({
  getParentRoute: () => homeRoute,
  path: '/budget',
  validateSearch: searchSchema,
  component: lazyRouteComponent(() => import('@/routes/protected/home/budget/budget-page')),
  errorComponent: AppRouteError,
});
