import { NotFoundRoute as TNotFoundRoute } from '@tanstack/react-router';

import { Route as rootRoute } from '@/routes/__root';

export const NotFoundRoute = new TNotFoundRoute({
  getParentRoute: () => rootRoute,
  component: NotFoundPage,
});

function NotFoundPage() {
  return <div>404 page not found. Sorry we are working on it. 🦄 ☕</div>;
}
