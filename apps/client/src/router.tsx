import { Session } from '@supabase/supabase-js';
import { QueryClient } from '@tanstack/react-query';
import { ReactQueryDevtools } from '@tanstack/react-query-devtools';
import { NotFoundRoute, Outlet, rootRouteWithContext, Route, Router } from '@tanstack/react-router';
import { TanStackRouterDevtools } from '@tanstack/router-devtools';

import { AppRouteError } from '@/components/app-route-error';
import { AsyncLoader } from '@/components/async-loader';
import { queryClient } from '@/lib/query-client';
import { authRoute } from '@/routes/auth/auth-route';
import { budgetRoute } from '@/routes/home/budget/budget-route';
import { dashboardRoute } from '@/routes/home/dashboard/dashboard-route';
import { homeIndexRoute, homeLayoutRoute, homeRoute } from '@/routes/home/home-route';
import { settingsRoute, settingsSectionRoute } from '@/routes/home/settings/settings-route';
import { welcomeRoute } from '@/routes/home/welcome/welcome-route';
import NoMatch from '@/routes/no-match';
import { Optional } from '@/types/app';

// const sentryCreateBrowserRouter = Sentry.wrapCreateBrowserRouter(createBrowserRouter);

const indexRoute = new Route({
  getParentRoute: () => rootRoute,
  path: '/',
  beforeLoad: async ({ navigate }) => {
    await navigate({ to: '/home' });
  },
});

const notFoundRoute = new NotFoundRoute({
  getParentRoute: () => rootRoute,
  component: () => <NoMatch />,
});

export const rootRoute = rootRouteWithContext<{ queryClient: QueryClient; session: Optional<Session> }>()({
  component: () => (
    <>
      <Outlet />
      <TanStackRouterDevtools position='bottom-left' />
      <ReactQueryDevtools buttonPosition='bottom-right' />
    </>
  ),
});

const routeTree = rootRoute.addChildren([
  indexRoute,
  authRoute,
  homeRoute.addChildren([
    welcomeRoute,
    homeLayoutRoute.addChildren([
      homeIndexRoute,
      dashboardRoute,
      budgetRoute,
      settingsRoute.addChildren([settingsSectionRoute]),
    ]),
  ]),
]);

export const router = new Router({
  routeTree,
  defaultPreload: false, // 'intent'
  // Since we're using React Query, we don't want loader calls to ever be stale
  // This will ensure that the loader is always called when the route is preloaded or visited
  defaultPreloadStaleTime: 0,
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
