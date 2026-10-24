import { queryKeys } from '@kijk/api/query-keys';
import { TooltipProvider } from '@kijk/ui/components/tooltip';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { Outlet, RouterProvider, createMemoryHistory, createRouter, type AnyRoute } from '@tanstack/react-router';
import { onTestFinished } from 'vite-plus/test';
import { render } from 'vitest-browser-react';

import { Route as appRoute } from '@/routes/_authenticated/_app/route';
import { Route as authenticatedRoute } from '@/routes/_authenticated/route';
import { routeTree } from '@/routeTree.gen';
import type { AuthGateway } from '@/shared/runtime/auth';
import { AppAuthContext } from '@/shared/runtime/auth';

interface RenderRouteOptions {
  initialEntry: string;
  overviewRoute: AnyRoute;
  seedQueryClient: (queryClient: QueryClient) => void;
  auth?: AuthGateway;
  bypassAuth?: boolean;
  stubOverviewLoader?: boolean;
}

/**
 * Renders the app router at `initialEntry` in a browser test with a seeded query client; auth guards and the overview
 * loader are stubbed out.
 */
export async function renderRoute({
  initialEntry,
  overviewRoute,
  seedQueryClient,
  auth = { getSession: async () => ({ id: 'session', userId: 'user' }) },
  bypassAuth = true,
  stubOverviewLoader = true,
}: RenderRouteOptions) {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false, staleTime: Infinity } },
  });
  queryClient.setQueryData(queryKeys.users.me, {
    status: 'Ready',
    user: { id: 'user', spaces: [{ id: 'space', isPersonal: true, role: { permissions: [] } }] },
  });
  seedQueryClient(queryClient);

  const originalOptions = [routeTree, authenticatedRoute, appRoute, overviewRoute].map((route) => ({
    route,
    options: { ...route.options },
  }));
  let screen: Awaited<ReturnType<typeof render>> | undefined;
  let cleanedUp = false;
  const cleanup = async () => {
    if (cleanedUp) {
      return;
    }
    cleanedUp = true;
    try {
      await screen?.unmount();
    } finally {
      queryClient.clear();
      for (const { route, options } of originalOptions) {
        route.options = options;
      }
    }
  };
  onTestFinished(cleanup);

  routeTree.update({ component: Outlet });
  Object.assign(routeTree.options, { shellComponent: undefined });
  Object.assign(authenticatedRoute.options, {
    ...(bypassAuth ? { beforeLoad: undefined } : {}),
    component: Outlet,
  });
  Object.assign(appRoute.options, { beforeLoad: undefined, component: Outlet });
  Object.assign(overviewRoute.options, {
    ...(stubOverviewLoader ? { loader: undefined } : {}),
    component: Outlet,
  });

  const router = createRouter({
    context: { auth, queryClient },
    history: createMemoryHistory({ initialEntries: [initialEntry] }),
    routeTree,
  });
  screen = await render(
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <AppAuthContext value={{ isLoaded: true, isSignedIn: true, signOut: async () => {} }}>
          <RouterProvider router={router} />
        </AppAuthContext>
      </TooltipProvider>
    </QueryClientProvider>,
  );

  return { cleanup, queryClient, router, screen };
}
