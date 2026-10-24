import { queryKeys } from '@kijk/api/query-keys';
import { expect, test, vi } from 'vite-plus/test';

import type { AuthGateway } from '@/shared/runtime/auth';
import { renderRoute } from '@/test/render-route';

import { Route } from './route';

const auth: AuthGateway = { getSession: async () => ({ id: 'session', userId: 'user' }) };

test('a direct space URL wins over the account default', async () => {
  const { router } = await renderRoute({
    initialEntry: '/shared',
    overviewRoute: Route,
    auth,
    seedQueryClient(client) {
      client.setQueryData(queryKeys.users.me, {
        status: 'Ready',
        user: {
          id: 'user',
          spaces: [
            { id: 'personal', isPersonal: true, isDefault: true },
            { id: 'shared', isPersonal: false, isDefault: false },
          ],
        },
      });
    },
  });
  await vi.waitFor(() => expect(router.state.status).toBe('idle'));
  expect(router.state.location.pathname).toBe('/shared');
  expect(router.state.matches.find((match) => match.routeId === Route.id)?.context.space?.id).toBe('shared');
});

test('an unknown membership redirects through root to the default space', async () => {
  const { router } = await renderRoute({
    initialEntry: '/unknown',
    overviewRoute: Route,
    auth,
    seedQueryClient(client) {
      client.setQueryData(queryKeys.users.me, {
        status: 'Ready',
        user: { id: 'user', spaces: [{ id: 'personal', isPersonal: true, isDefault: true }] },
      });
    },
  });
  await vi.waitFor(() => expect(router.state.location.pathname).toBe('/personal'));
});
