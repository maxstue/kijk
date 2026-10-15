import type { LoadedClerk } from '@clerk/react/types';
import { expect, test, vi } from 'vite-plus/test';

import { Route as consumptionsRoute } from '@/routes/_authenticated/_app/$spaceId/consumptions/_overview/route';
import { Route as authPage } from '@/routes/auth';
import { renderRoute } from '@/test/render-route';

import { Route } from './route';

test('redirects an absent session token to auth and remembers the target', async () => {
  const getToken = vi.fn<() => Promise<string | undefined>>().mockResolvedValue(undefined);
  const { router } = await renderRoute({
    initialEntry: '/consumptions?view=year&year=2026&month=september',
    overviewRoute: authPage,
    bypassAuth: false,
    authClient: { session: { getToken } } as unknown as LoadedClerk,
    seedQueryClient() {},
  });
  await vi.waitFor(() => expect(router.state.location.pathname).toBe('/auth'));
  expect(router.state.location.search).toEqual({ from: '/consumptions?view=year&year=2026&month=september' });
  expect(getToken).toHaveBeenCalledTimes(2);
});

test('allows an authenticated session and exposes it to descendant routes', async () => {
  const session = { getToken: vi.fn<() => Promise<string>>().mockResolvedValue('test-token') };
  const { router } = await renderRoute({
    initialEntry: '/consumptions?view=year&year=2026&month=september',
    overviewRoute: consumptionsRoute,
    bypassAuth: false,
    authClient: { session } as unknown as LoadedClerk,
    seedQueryClient() {},
  });
  await vi.waitFor(() => expect(router.state.status).toBe('idle'));
  expect(router.state.location.pathname).toBe('/consumptions');
  expect(router.state.matches.find((match) => match.routeId === '/_authenticated')?.context.session).toBe(session);
  expect(session.getToken).toHaveBeenCalledOnce();
});

test('the protected-route guard rejects whitespace-only session tokens', async () => {
  const beforeLoad = Route.options.beforeLoad!;
  const context = {
    location: { href: '/consumptions' },
    context: { authClient: { session: { getToken: async () => '   ' } } },
  } as Parameters<typeof beforeLoad>[0];
  await expect(beforeLoad(context)).rejects.toMatchObject({
    options: { to: '/auth', search: { from: '/consumptions' } },
  });
});
