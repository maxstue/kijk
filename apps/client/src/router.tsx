import { hydrateTheme } from '@kijk/core/stores/theme-store';
import { createRouter } from '@tanstack/react-router';

import { webAuth } from '@/platform/web/auth';
import { initializeTelemetry } from '@/platform/web/telemetry';
import { routeTree } from '@/routeTree.gen';
import { AppError } from '@/shared/components/errors/app-error';
import { NotFound } from '@/shared/components/not-found';
import { Loader } from '@/shared/components/ui/loaders/loader';
import { setupApiClient } from '@/shared/lib/api-client';
import { createQueryClient } from '@/shared/lib/query-client';

/** Creates an isolated router and query cache for every server request. */
export function getRouter() {
  const router = createRouter({
    context: { auth: webAuth, queryClient: createQueryClient() },
    defaultErrorComponent: AppError,
    defaultNotFoundComponent: NotFound,
    defaultPendingComponent: () => <Loader className='h-6 w-6' />,
    defaultPreload: 'intent',
    defaultPreloadStaleTime: 0,
    defaultStructuralSharing: true,
    routeTree,
    scrollRestoration: true,
  });
  if (!import.meta.env.SSR) {
    setupApiClient();
    hydrateTheme();
    initializeTelemetry(router);
  }
  return router;
}

/** Router type shared with browser tracing. */
export type AppRouter = ReturnType<typeof getRouter>;

declare module '@tanstack/react-router' {
  interface Register {
    router: AppRouter;
  }
}
