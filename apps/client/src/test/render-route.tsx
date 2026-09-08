import { TooltipProvider } from '@kijk/ui/components/tooltip';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { Outlet, RouterProvider, createMemoryHistory, createRouter, type AnyRoute } from '@tanstack/react-router';
import { render } from 'vitest-browser-react';

import { Route as appRoute } from '@/routes/_authenticated/_app/route';
import { Route as authenticatedRoute } from '@/routes/_authenticated/route';
import { routeTree } from '@/routeTree.gen';

interface RenderRouteOptions {
  initialEntry: string;
  overviewRoute: AnyRoute;
  seedQueryClient: (queryClient: QueryClient) => void;
}

export async function renderRoute({ initialEntry, overviewRoute, seedQueryClient }: RenderRouteOptions) {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false, staleTime: Infinity } },
  });
  seedQueryClient(queryClient);

  routeTree.update({ component: Outlet });
  Object.assign(authenticatedRoute.options, { beforeLoad: undefined, component: Outlet });
  Object.assign(appRoute.options, { beforeLoad: undefined, component: Outlet });
  Object.assign(overviewRoute.options, { loader: undefined, component: Outlet });

  const router = createRouter({
    context: { authClient: undefined, queryClient },
    history: createMemoryHistory({ initialEntries: [initialEntry] }),
    routeTree,
  });
  const screen = await render(
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <RouterProvider router={router} />
      </TooltipProvider>
    </QueryClientProvider>,
  );

  return { queryClient, router, screen };
}
