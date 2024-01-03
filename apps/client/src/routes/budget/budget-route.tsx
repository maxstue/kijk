import { Route } from '@tanstack/react-router';

import { AppRouteError } from '@/components/app-route-error';
import { BudgetPage } from '@/routes/budget/budget-page';
import { rootIndexRoute } from '@/routes/root-route';

// TODO add params and searchparams validation
export const budgetRoute = new Route({
  getParentRoute: () => rootIndexRoute,
  path: '/budget',
  component: BudgetPage,
  errorComponent: AppRouteError,
});
