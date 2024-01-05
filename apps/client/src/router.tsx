import { Router } from '@tanstack/react-router';

import { AppRouteError } from '@/components/app-route-error';
import { AsyncLoader } from '@/components/async-loader';
import { queryClient } from '@/lib/query-client';
import { authRoute } from '@/routes/auth/auth-route';
import { notFoundRoute } from '@/routes/not-found-route';
import { budgetRoute } from '@/routes/protected/home/budget/budget-route';
import { dashboardRoute } from '@/routes/protected/home/dashboard/dashboard-route';
import { homeIndexRoute, homeRoute } from '@/routes/protected/home/home-route';
import { settingsIndexRoute, settingsRoute } from '@/routes/protected/home/settings/settings-route';
import { settingsSectionRoute } from '@/routes/protected/home/settings/settings-section-route';
import { protectedRoute } from '@/routes/protected/protected-route';
import { welcomeRoute } from '@/routes/protected/welcome/welcome-route';
import { rootIndexRoute } from '@/routes/root-index-route';
import { rootRoute } from '@/routes/root-route';

// const sentryCreateBrowserRouter = Sentry.wrapCreateBrowserRouter(createBrowserRouter);

const routeTree = rootRoute.addChildren([
  rootIndexRoute,
  authRoute,
  protectedRoute.addChildren([
    welcomeRoute,
    homeRoute.addChildren([
      homeIndexRoute,
      dashboardRoute,
      budgetRoute,
      settingsRoute.addChildren([settingsIndexRoute, settingsSectionRoute]),
    ]),
  ]),
]);

export const router = new Router({
  routeTree,
  defaultPreload: 'intent',
  // Since we're using React Query, we don't want loader calls to ever be stale
  // This will ensure that the loader is always called when the route is preloaded or visited
  defaultPreloadStaleTime: 0,
  defaultPreloadDelay: 500,
  context: {
    queryClient,
    session: undefined,
  },
  notFoundRoute: notFoundRoute,
  defaultPendingComponent: () => <AsyncLoader />,
  defaultErrorComponent: AppRouteError,
});

declare module '@tanstack/react-router' {
  interface Register {
    router: typeof router;
  }
}
