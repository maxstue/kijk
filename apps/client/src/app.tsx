import { Toaster } from '@kijk/ui/components/toaster';
import { TooltipProvider } from '@kijk/ui/components/tooltip';
import { QueryClientProvider, QueryErrorResetBoundary, type QueryClient } from '@tanstack/react-query';
import type { ReactNode } from 'react';
import { ErrorBoundary, type FallbackProps } from 'react-error-boundary';

import { AppError } from '@/shared/components/errors/app-error';
import { ThemeModeSwitcher } from '@/shared/components/theme-mode-switcher';
import { ErrorService } from '@/shared/lib/error-tracking';

interface AppProps {
  children: ReactNode;
  queryClient: QueryClient;
}

/** App root: error boundary, providers (query, tooltips), theme handling and toasts around the router. */
export function App({ children, queryClient }: AppProps) {
  return (
    <QueryClientProvider client={queryClient}>
      <QueryErrorResetBoundary>
        {({ reset }) => (
          <ErrorBoundary FallbackComponent={AppErrorFallback} onReset={reset} onError={reportError}>
            <TooltipProvider>
              {children}
              <ThemeModeSwitcher />
              <Toaster position='top-right' />
            </TooltipProvider>
          </ErrorBoundary>
        )}
      </QueryErrorResetBoundary>
    </QueryClientProvider>
  );
}

function AppErrorFallback({ error, resetErrorBoundary }: FallbackProps) {
  return <AppError error={error} onRetry={resetErrorBoundary} />;
}

function reportError(error: unknown) {
  ErrorService.captureException(error);
}
