import { Suspense } from 'react';
import { QueryClientProvider } from '@tanstack/react-query';
import { RouterProvider } from '@tanstack/react-router';
import { PostHogProvider } from 'posthog-js/react';
import { ErrorBoundary } from 'react-error-boundary';

import { router } from '@/router';
import { AuthProvider } from '@/shared/components/auth-provider';
import { AppError } from '@/shared/components/errors/app-error';
import { ThemeModeSwitcher } from '@/shared/components/theme-mode-switcher';
import { ThemeSwitcher } from '@/shared/components/theme-switcher';
import { ThemeWrapper } from '@/shared/components/theme-wrapper';
import { InitLoader } from '@/shared/components/ui/loaders/init-loader';
import { Toaster } from '@/shared/components/ui/toaster';
import { AnalyticsService } from '@/shared/lib/analytics-tracking';
import { ErrorService } from '@/shared/lib/error-tracking';
import { queryClient } from '@/shared/lib/query-client';

const App = ErrorService.withProfiler(function App() {
  return (
    <ErrorBoundary fallbackRender={AppError}>
      <QueryClientProvider client={queryClient}>
        <Suspense fallback={<InitLoader />}>
          <AuthProvider>
            <PostHogProvider client={AnalyticsService.getInstance()}>
              <ThemeWrapper>
                <RouterProvider router={router} />
                <ThemeSwitcher />
                <ThemeModeSwitcher />
                <Toaster />
              </ThemeWrapper>
            </PostHogProvider>
          </AuthProvider>
        </Suspense>
      </QueryClientProvider>
    </ErrorBoundary>
  );
});

export default App;