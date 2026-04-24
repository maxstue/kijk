import { Toaster } from '@kijk/ui/components/toaster';
import { TooltipProvider } from '@kijk/ui/components/tooltip';
import { QueryClientProvider } from '@tanstack/react-query';
import { Suspense } from 'react';
import { ErrorBoundary } from 'react-error-boundary';

import { AnalyticsProvider } from '@/shared/components/analytics-provider';
import { AuthProvider } from '@/shared/components/auth-provider';
import { AppError } from '@/shared/components/errors/app-error';
import RouterProvider from '@/shared/components/router-provider';
import { ThemeModeSwitcher } from '@/shared/components/theme-mode-switcher';
import { InitLoader } from '@/shared/components/ui/loaders/init-loader';
import { ErrorService } from '@/shared/lib/error-tracking';
import { queryClient } from '@/shared/lib/query-client';

export const App = ErrorService.withProfiler(function App() {
  return (
    <ErrorBoundary fallback={<AppError />}>
      <QueryClientProvider client={queryClient}>
        <Suspense fallback={<InitLoader />}>
          <AuthProvider>
            <AnalyticsProvider>
              <TooltipProvider>
                <RouterProvider />
                <ThemeModeSwitcher />
                <Toaster />
              </TooltipProvider>
            </AnalyticsProvider>
          </AuthProvider>
        </Suspense>
      </QueryClientProvider>
    </ErrorBoundary>
  );
});
