import { expect, test, vi } from 'vite-plus/test';

import { Route as consumptionsRoute } from '@/routes/_authenticated/_app/$spaceId/consumptions/_overview/route';
import { Route as authPage } from '@/routes/auth';
import type { AppSession } from '@/shared/runtime/auth';
import { renderRoute } from '@/test/render-route';

import { Route } from './route';

test('redirects an absent session to auth and remembers the complete target', async () => {
  const getSession = vi.fn<() => Promise<AppSession | null>>().mockResolvedValue(null);
  const { router } = await renderRoute({
    initialEntry: '/space/consumptions?view=year&year=2026&month=september',
    overviewRoute: authPage,
    bypassAuth: false,
    auth: { getSession },
    seedQueryClient() {},
  });
  await vi.waitFor(() => expect(router.state.location.pathname).toBe('/auth'));
  expect(router.state.location.search).toEqual({ from: '/space/consumptions?view=year&year=2026&month=september' });
  expect(getSession).toHaveBeenCalled();
});

test('exposes identity to descendants without exposing an API token', async () => {
  const session = { id: 'session', userId: 'user' };
  const getSession = vi.fn<() => Promise<AppSession | null>>().mockResolvedValue(session);
  const { router } = await renderRoute({
    initialEntry: '/space/consumptions?view=year&year=2026&month=september',
    overviewRoute: consumptionsRoute,
    bypassAuth: false,
    auth: { getSession },
    seedQueryClient() {},
  });
  await vi.waitFor(() => expect(router.state.status).toBe('idle'));
  expect(router.state.location.pathname).toBe('/space/consumptions');
  expect(router.state.matches.find((match) => match.routeId === '/_authenticated')?.context.session).toBe(session);
  expect(getSession).toHaveBeenCalledOnce();
});

test('a failed session check does not admit the user to private routes', async () => {
  const beforeLoad = Route.options.beforeLoad!;
  const context = {
    location: { href: '/space/consumptions' },
    context: {
      auth: {
        getSession: async () => {
          throw new Error('Session unavailable');
        },
      },
    },
  } as unknown as Parameters<typeof beforeLoad>[0];
  await expect(beforeLoad(context)).rejects.toThrow('Session unavailable');
});
