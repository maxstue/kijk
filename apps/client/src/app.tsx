import { Suspense } from 'react';
import { QueryClientProvider } from '@tanstack/react-query';
import { ErrorBoundary } from 'react-error-boundary';

import { AnalyticsProvider } from '@/shared/components/analytics-provider';
import { AuthProvider } from '@/shared/components/auth-provider';
import { AppError } from '@/shared/components/errors/app-error';
import { InitLoader } from '@/shared/components/ui/loaders/init-loader';
import { ErrorService } from '@/shared/lib/error-tracking';
import { queryClient } from '@/shared/lib/query-client';
import { ThemeModeSwitcher } from '@/shared/components/theme-mode-switcher';
import RouterProvider from '@/shared/components/router-provider';
import { AppToaster } from '@/shared/components/ui/toaster';

const App = ErrorService.withProfiler(function App() {
  return (
    <ErrorBoundary fallback={<AppError />}>
      <QueryClientProvider client={queryClient}>
        <Suspense fallback={<InitLoader />}>
          <AuthProvider>
            <AnalyticsProvider>
              <RouterProvider />
              <ThemeModeSwitcher />
              <AppToaster />
            </AnalyticsProvider>
          </AuthProvider>
        </Suspense>
      </QueryClientProvider>
    </ErrorBoundary>
  );
});

export default App;
