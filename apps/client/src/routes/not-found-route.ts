import { NotFoundRoute } from '@tanstack/react-router';

import NotFoundPage from '@/routes/no-found-page';
import { rootRoute } from '@/routes/root-route';

export const notFoundRoute = new NotFoundRoute({
  getParentRoute: () => rootRoute,
  component: NotFoundPage,
});
