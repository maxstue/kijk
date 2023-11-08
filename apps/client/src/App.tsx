import { QueryClientProvider } from '@tanstack/react-query';
import { ReactQueryDevtools } from '@tanstack/react-query-devtools';
import { ErrorBoundary } from 'react-error-boundary';
import { RouterProvider } from 'react-router-dom';

import { AppError } from '@/components/app-error';
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
            <RouterProvider router={router} fallbackElement={<div>Loading...</div>} />
            <ThemeSwitcher />
            <ThemeModeSwitcher />
          </ThemeWrapper>
        </AuthProvider>
        <ReactQueryDevtools initialIsOpen={false} buttonPosition='bottom-left' />
      </QueryClientProvider>
    </ErrorBoundary>
  );
}

export default App;
