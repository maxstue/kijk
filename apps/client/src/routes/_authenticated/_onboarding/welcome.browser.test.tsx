import { queryKeys } from '@kijk/api/query-keys';
import type { ReceivedInvitation } from '@kijk/api/users/types';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import {
  Outlet,
  RouterProvider,
  createMemoryHistory,
  createRootRoute,
  createRoute,
  createRouter,
} from '@tanstack/react-router';
import { HttpResponse, http } from 'msw';
import type { toast } from 'sonner';
import { expect, onTestFinished, test, vi } from 'vite-plus/test';
import { render } from 'vitest-browser-react';

import { worker } from '@/test/mocks/browser';

import { Route } from './welcome';

interface FinishProps {
  onComplete: () => Promise<void>;
}

vi.mock('@/app/welcome/welcome-flow', () => ({
  WelcomeFlow: ({ onComplete }: FinishProps) => (
    <button type='button' onClick={() => void onComplete()}>
      Finish setup
    </button>
  ),
}));
vi.mock('sonner', () => ({ toast: { error: vi.fn<typeof toast.error>(), success: vi.fn<typeof toast.success>() } }));

const invitation: ReceivedInvitation = {
  createdAt: '2026-11-28T10:00:00Z',
  expiresAt: '2026-12-05T10:00:00Z',
  id: 'invitation',
  invitedByName: 'Max',
  roleId: 'member',
  roleName: 'Member',
  spaceId: 'family',
  spaceName: 'Family',
};

async function renderWelcome(invitations: ReceivedInvitation[]) {
  worker.use(
    http.get('*/api/users/me/invitations', () => HttpResponse.json(invitations)),
    http.post('*/api/users/me/invitations/:invitationId/accept', () => HttpResponse.json({ spaceId: 'family' })),
  );
  const queryClient = new QueryClient({ defaultOptions: { queries: { retry: false, staleTime: Infinity } } });
  queryClient.setQueryData(queryKeys.users.me, { status: 'Ready', identity: {} });
  const root = createRootRoute({ component: Outlet });
  const welcome = createRoute({ getParentRoute: () => root, path: 'welcome', component: Route.options.component });
  const home = createRoute({ getParentRoute: () => root, path: '/', component: () => 'App start' });
  const space = createRoute({ getParentRoute: () => root, path: '$spaceId', component: () => 'Space' });
  const router = createRouter({
    history: createMemoryHistory({ initialEntries: ['/welcome'] }),
    routeTree: root.addChildren([welcome, home, space]),
  });
  const screen = await render(
    <QueryClientProvider client={queryClient}>
      <RouterProvider router={router} />
    </QueryClientProvider>,
  );
  onTestFinished(async () => {
    await screen.unmount();
    queryClient.clear();
  });
  return { router, screen };
}

test('without invitations, finishing onboarding opens the app', async () => {
  const { router, screen } = await renderWelcome([]);

  await screen.getByRole('button', { name: 'Finish setup' }).click();

  await vi.waitFor(() => expect(router.state.location.pathname).toBe('/'));
});

test('with invitations, finishing onboarding shows them before the app starts', async () => {
  const { router, screen } = await renderWelcome([invitation]);

  await screen.getByRole('button', { name: 'Finish setup' }).click();

  await expect.element(screen.getByText('Max invited you to “Family”')).toBeVisible();
  expect(router.state.location.pathname).toBe('/welcome');
  await screen.getByRole('button', { name: 'Join Family' }).click();
  await vi.waitFor(() => expect(router.state.location.pathname).toBe('/family'));
});

test('later opens the personal space and keeps the invitation', async () => {
  const { router, screen } = await renderWelcome([invitation]);

  await screen.getByRole('button', { name: 'Finish setup' }).click();
  await screen.getByRole('button', { name: 'Later' }).click();

  await vi.waitFor(() => expect(router.state.location.pathname).toBe('/'));
});
