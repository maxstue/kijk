import { Toaster } from '@kijk/ui/components/toaster';
import { TooltipProvider } from '@kijk/ui/components/tooltip';
import { QueryClientProvider } from '@tanstack/react-query';
import { Suspense, useLayoutEffect } from 'react';
import { ErrorBoundary } from 'react-error-boundary';

import { AuthProvider } from '@/app/root/providers/auth-provider';
import RouterProvider from '@/app/root/providers/router-provider';
import { AppError } from '@/shared/components/errors/app-error';
import { ThemeModeSwitcher } from '@/shared/components/theme-mode-switcher';
import { InitLoader } from '@/shared/components/ui/loaders/init-loader';
import { markReactReady } from '@/shared/lib/bootstrap-loader';
import { queryClient } from '@/shared/lib/query-client';

/** App root: error boundary, providers (auth, query, tooltips), theme handling and toasts around the router. */
export function App() {
  useLayoutEffect(() => {
    markReactReady();
  }, []);

  return (
    <ErrorBoundary fallback={<AppError />}>
      <QueryClientProvider client={queryClient}>
        <Suspense fallback={<InitLoader />}>
          <AuthProvider>
            <TooltipProvider>
              <RouterProvider />
              <ThemeModeSwitcher />
              <Toaster position='top-right' />
            </TooltipProvider>
          </AuthProvider>
        </Suspense>
      </QueryClientProvider>
    </ErrorBoundary>
  );
}
