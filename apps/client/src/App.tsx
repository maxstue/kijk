import * as Sentry from '@sentry/react';
import { QueryClientProvider } from '@tanstack/react-query';
import { RouterProvider } from '@tanstack/react-router';
import { ErrorBoundary } from 'react-error-boundary';

import { router } from '@/router';
import { AppError } from '@/shared/components/app-error';
import { AuthProvider } from '@/shared/components/auth-provider';
import { ThemeModeSwitcher } from '@/shared/components/theme-mode-switcher';
import { ThemeSwitcher } from '@/shared/components/theme-switcher';
import { ThemeWrapper } from '@/shared/components/theme-wrapper';
import { Toaster } from '@/shared/components/ui/toaster';
import { queryClient } from '@/shared/lib/query-client';

const App = Sentry.withProfiler(function App() {
  return (
    <ErrorBoundary FallbackComponent={AppError}>
      <QueryClientProvider client={queryClient}>
        <AuthProvider>
          <ThemeWrapper>
            <RouterProvider router={router} />
            <ThemeSwitcher />
            <ThemeModeSwitcher />
            <Toaster />
          </ThemeWrapper>
        </AuthProvider>
      </QueryClientProvider>
    </ErrorBoundary>
  );
});

export default App;
