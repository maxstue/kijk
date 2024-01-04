// import { Route } from '@tanstack/react-router';

// import { AppRouteError } from '@/components/app-route-error';
// import { BudgetPage } from '@/routes/budget/budget-page';
// import { homeLayoutRoute } from '@/routes/home-route';

// // TODO add params and searchparams validation
// export const budgetRoute = new Route({
//   getParentRoute: () => homeLayoutRoute,
//   path: '/budget',
//   component: BudgetPage,
//   errorComponent: AppRouteError,
// });

import { Route } from '@tanstack/react-router';
import * as z from 'zod';

import { AppRouteError } from '@/components/app-route-error';
import { BudgetPage } from '@/routes/budget/budget-page';
import { homeLayoutRoute } from '@/routes/home-route';
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
  getParentRoute: () => homeLayoutRoute,
  path: '/budget',
  validateSearch: searchSchema,
  component: BudgetPage,
  errorComponent: AppRouteError,
});
