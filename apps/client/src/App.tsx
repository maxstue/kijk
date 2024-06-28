import { Suspense } from 'react';
import * as Sentry from '@sentry/react';
import { QueryClientProvider } from '@tanstack/react-query';
import { RouterProvider } from '@tanstack/react-router';
import { ErrorBoundary } from 'react-error-boundary';

import { router } from '@/router';
import { AuthProvider } from '@/shared/components/auth-provider';
import { AppError } from '@/shared/components/errors/app-error';
import { ThemeModeSwitcher } from '@/shared/components/theme-mode-switcher';
import { ThemeSwitcher } from '@/shared/components/theme-switcher';
import { ThemeWrapper } from '@/shared/components/theme-wrapper';
import { InitLaoder } from '@/shared/components/ui/loaders/init-laoder';
import { Toaster } from '@/shared/components/ui/toaster';
import { queryClient } from '@/shared/lib/query-client';

const App = Sentry.withProfiler(function App() {
  return (
    <ErrorBoundary fallbackRender={AppError}>
      <QueryClientProvider client={queryClient}>
        <Suspense fallback={<InitLaoder />}>
          <AuthProvider>
            <ThemeWrapper>
              <RouterProvider router={router} />
              <ThemeSwitcher />
              <ThemeModeSwitcher />
              <Toaster />
            </ThemeWrapper>
          </AuthProvider>
        </Suspense>
      </QueryClientProvider>
    </ErrorBoundary>
  );
});

export default App;
