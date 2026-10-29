import { hydrateTheme } from '@kijk/core/stores/theme-store';
import { createRouter } from '@tanstack/react-router';

import { routeTree } from '@/routeTree.gen';
import { serverAuth } from '@/server/session';
import { AppError } from '@/shared/components/errors/app-error';
import { NotFound } from '@/shared/components/not-found';
import { Loader } from '@/shared/components/ui/loaders/loader';
import { AnalyticsService } from '@/shared/lib/analytics-tracking';
import { setupApiClient } from '@/shared/lib/api-client';
import { ErrorService } from '@/shared/lib/error-tracking';
import { createQueryClient } from '@/shared/lib/query-client';
import { TracingService } from '@/shared/lib/tracing';

/** Creates an isolated router and query cache for every server request. */
export function getRouter() {
  const router = createRouter({
    context: { auth: serverAuth, queryClient: createQueryClient() },
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
    ErrorService.init();
    AnalyticsService.init();
    TracingService.init(router);
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
