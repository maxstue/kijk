import { ApiError } from '@kijk/api/errors';
import { queryKeys } from '@kijk/api/query-keys';
import { expect, test, vi } from 'vite-plus/test';

import { renderRoute } from '@/test/render-route';

import { Route } from './auth';

test('keeps a backend failure visible on auth and retries before continuing to the requested page', async () => {
  const problem = new ApiError(
    {
      status: 503,
      title: 'Service Unavailable',
      detail: 'You are signed in, but your account could not be loaded. Please try again later.',
    },
    new Response(null, { status: 503 }),
    new Request('https://kijk.test/api/users/me'),
  );
  const { router, screen } = await renderRoute({
    initialEntry: '/auth?from=%2Fterms',
    overviewRoute: Route,
    seedQueryClient(queryClient) {
      vi.spyOn(queryClient, 'query')
        .mockRejectedValueOnce(problem)
        .mockResolvedValueOnce(queryClient.getQueryData(queryKeys.users.me));
    },
  });

  await expect
    .element(screen.getByRole('alert'))
    .toHaveTextContent('You are signed in, but your account could not be loaded. Please try again later.');
  await expect.element(screen.getByText('Signed in, but your Kijk account could not be loaded')).toBeVisible();
  expect(router.state.location.pathname).toBe('/auth');
  await expect.element(screen.getByRole('button', { name: 'Sign out' })).toBeVisible();

  await screen.getByRole('button', { name: 'Try again' }).click();
  await vi.waitFor(() => expect(router.state.location.pathname).toBe('/terms'));
});

test('shows progress while the account is loading and does not navigate prematurely', async () => {
  const pending = Promise.withResolvers<unknown>();
  const { router, screen, queryClient } = await renderRoute({
    initialEntry: '/auth?from=%2Fterms',
    overviewRoute: Route,
    seedQueryClient(client) {
      vi.spyOn(client, 'query').mockReturnValueOnce(pending.promise);
    },
  });
  try {
    await expect.element(screen.getByRole('status')).toHaveTextContent('Getting your space in order…');
    expect(router.state.location.pathname).toBe('/auth');
  } finally {
    pending.resolve(queryClient.getQueryData(queryKeys.users.me));
  }
  await vi.waitFor(() => expect(router.state.location.pathname).toBe('/terms'));
});

test('a failed session check is actionable and does not redirect to the landing page', async () => {
  const { router, screen } = await renderRoute({
    initialEntry: '/auth',
    overviewRoute: Route,
    auth: {
      getSession: async () => {
        throw new Error('internal authentication provider details');
      },
    },
    seedQueryClient() {},
  });
  await expect
    .element(screen.getByRole('alert'))
    .toHaveTextContent('We could not verify your session. Please try again. If this continues, contact support.');
  expect(router.state.location.pathname).toBe('/auth');
  await expect.element(screen.getByRole('button', { name: 'Try again' })).toBeVisible();
});
