import { Toaster } from '@kijk/ui/components/toaster';
import { TooltipProvider } from '@kijk/ui/components/tooltip';
import { QueryClientProvider, type QueryClient } from '@tanstack/react-query';
import type { ReactNode } from 'react';
import { ErrorBoundary } from 'react-error-boundary';

import { AppError } from '@/shared/components/errors/app-error';
import { ThemeModeSwitcher } from '@/shared/components/theme-mode-switcher';

/** App root: error boundary, providers (query, tooltips), theme handling and toasts around the router. */
export function App({ children, queryClient }: { children: ReactNode; queryClient: QueryClient }) {
  return (
    <ErrorBoundary fallback={<AppError />}>
      <QueryClientProvider client={queryClient}>
        <TooltipProvider>
          {children}
          <ThemeModeSwitcher />
          <Toaster position='top-right' />
        </TooltipProvider>
      </QueryClientProvider>
    </ErrorBoundary>
  );
}
