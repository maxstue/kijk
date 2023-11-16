import { RouteObject } from 'react-router-dom';

import { AppRouteError } from '@/components/app-route-error';
import { BudgetPage } from '@/routes/budget/budget-page';

export const budgetRoute = {
  path: 'budget',
  element: <BudgetPage />,
  errorElement: <AppRouteError />,
} as RouteObject;
