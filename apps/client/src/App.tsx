import { QueryClientProvider } from '@tanstack/react-query';
import { ReactQueryDevtools } from '@tanstack/react-query-devtools';
import { RouterProvider } from '@tanstack/react-router';

import { AuthProvider } from '@/components/auth-provider';
import { ThemeModeSwitcher } from '@/components/theme-mode-switcher';
import { ThemeSwitcher } from '@/components/theme-switcher';
import { ThemeWrapper } from '@/components/theme-wrapper';
import { queryClient } from '@/lib/query-client';
import { router } from '@/router';

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <ThemeWrapper>
          <RouterProvider router={router} />
          <ThemeSwitcher />
          <ThemeModeSwitcher />
        </ThemeWrapper>
      </AuthProvider>
      <ReactQueryDevtools initialIsOpen={false} buttonPosition='bottom-left' />
      {/* <TanStackRouterDevtools position='bottom-right' router={router} /> */}
    </QueryClientProvider>
  );
}

export default App;
