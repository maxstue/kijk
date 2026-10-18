import { queryKeys } from '@kijk/api/query-keys';
import { SidebarProvider } from '@kijk/ui/components/sidebar';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import {
  RouterProvider,
  createMemoryHistory,
  createRootRoute,
  createRoute,
  createRouter,
} from '@tanstack/react-router';
import { expect, onTestFinished, test, vi } from 'vite-plus/test';
import { render } from 'vitest-browser-react';

import { SettingsNav } from './settings-nav';

vi.mock('@kijk/core/lib/browser-storage', () => ({
  browserStorage: { getItem: () => 'shared' },
}));

test('Back to app returns to the last visited space instead of the default', async () => {
  const client = new QueryClient({ defaultOptions: { queries: { staleTime: Infinity } } });
  client.setQueryData(queryKeys.users.me, {
    status: 'Ready',
    user: {
      id: 'user',
      spaces: [
        { id: 'personal', name: 'Personal', isPersonal: true, isDefault: true },
        { id: 'shared', name: 'Shared', isPersonal: false, isDefault: false },
      ],
    },
  });
  const root = createRootRoute({ component: SettingsNav });
  const settings = createRoute({ getParentRoute: () => root, path: '/settings/profile' });
  const space = createRoute({ getParentRoute: () => root, path: '/$spaceId' });
  const router = createRouter({
    routeTree: root.addChildren([settings, space]),
    history: createMemoryHistory({ initialEntries: ['/settings/profile'] }),
  });
  const screen = await render(
    <QueryClientProvider client={client}>
      <SidebarProvider>
        <RouterProvider router={router} />
      </SidebarProvider>
    </QueryClientProvider>,
  );
  onTestFinished(async () => {
    await screen.unmount();
    client.clear();
  });

  await screen.getByRole('link', { name: 'Back to app' }).click();

  await vi.waitFor(() => expect(router.state.location.pathname).toBe('/shared'));
});
