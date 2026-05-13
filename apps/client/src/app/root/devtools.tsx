import { TanStackDevtools } from '@tanstack/react-devtools';
import { ReactQueryDevtoolsPanel } from '@tanstack/react-query-devtools';
import { TanStackRouterDevtoolsPanel } from '@tanstack/react-router-devtools';
import { lazy } from 'react';

import { config } from '@/shared/config';

export function RootDevtools() {
  return (
    <>
      <DevModeIndicator />
      <TanStackDevtools
        plugins={[
          {
            name: 'TanStack Query',
            render: <ReactQueryDevtoolsPanel />,
          },
          {
            name: 'TanStack Router',
            render: <TanStackRouterDevtoolsPanel />,
          },
        ]}
      />
    </>
  );
}

function DevModeIndicator() {
  return config.Mode === 'production' ? undefined : <LazyDevModeIndicator />;
}

const LazyDevModeIndicator = lazy(() =>
  import('@/shared/components/dev-mode-indicator').then(({ DevModeIndicator: Component }) => ({
    default: Component,
  })),
);
