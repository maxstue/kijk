import { RouteObject } from 'react-router-dom';

import { AppRouteError } from '@/components/app-route-error';
import { BudgetPage } from '@/routes/budget/budget-page';

// const searchSchema = z.object({
//   month: z
//     .string()
//     .transform((x) => x as Months)
//     .optional(),
//   year: z.number().optional(),
// });

// export type BudgetSearch = z.infer<typeof searchSchema>;

// export const budgetRoute = new Route({
//   getParentRoute: () => authenticatedRoute,
//   path: 'budget',
//   validateSearch: searchSchema,
//   component: lazyRouteComponent(() => import('./budget-page'), 'BudgetPage'),
// });

export const budgetRoute = {
  path: 'budget',
  element: <BudgetPage />,
  errorElement: <AppRouteError />,
} as RouteObject;
