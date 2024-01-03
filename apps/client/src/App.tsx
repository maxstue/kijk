import { QueryClientProvider } from '@tanstack/react-query';
import { RouterProvider } from '@tanstack/react-router';
import { ErrorBoundary } from 'react-error-boundary';

import { AppError } from '@/components/app-error';
import { AsyncLoader } from '@/components/async-loader';
import { AuthProvider } from '@/components/auth-provider';
import { ThemeModeSwitcher } from '@/components/theme-mode-switcher';
import { ThemeSwitcher } from '@/components/theme-switcher';
import { ThemeWrapper } from '@/components/theme-wrapper';
import { queryClient } from '@/lib/query-client';
import { router } from '@/router';

function App() {
  return (
    <ErrorBoundary FallbackComponent={AppError}>
      <QueryClientProvider client={queryClient}>
        <AuthProvider>
          <ThemeWrapper>
            <RouterProvider router={router} defaultPendingComponent={AsyncLoader} />
            <ThemeSwitcher />
            <ThemeModeSwitcher />
          </ThemeWrapper>
        </AuthProvider>
      </QueryClientProvider>
    </ErrorBoundary>
  );
}

export default App;
