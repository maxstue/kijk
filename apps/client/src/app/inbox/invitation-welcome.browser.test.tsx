import { queryKeys } from '@kijk/api/query-keys';
import type { ReceivedInvitation } from '@kijk/api/users/types';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { HttpResponse, http } from 'msw';
import type { PropsWithChildren } from 'react';
import type { toast } from 'sonner';
import { expect, onTestFinished, test, vi } from 'vite-plus/test';

import { worker } from '@/test/mocks/browser';
import { render } from '@/test/render-space';

import { membershipPrivacyNote } from './constants';
import { InvitationWelcome } from './invitation-welcome';

vi.mock('sonner', () => ({ toast: { error: vi.fn<typeof toast.error>(), success: vi.fn<typeof toast.success>() } }));

const invitation: ReceivedInvitation = {
  createdAt: '2026-11-28T10:00:00Z',
  expiresAt: '2026-12-05T10:00:00Z',
  id: 'invitation',
  invitedByName: 'Max',
  roleId: 'viewer',
  roleName: 'Viewer',
  spaceId: 'family',
  spaceName: 'Family',
};

interface Props extends PropsWithChildren {}

async function renderWelcome(invitations: ReceivedInvitation[]) {
  const client = new QueryClient({ defaultOptions: { queries: { retry: false, staleTime: Infinity } } });
  client.setQueryData(queryKeys.users.invitations, invitations);
  const onJoined = vi.fn<(spaceId: string) => void>();
  const onLater = vi.fn<() => void>();
  function Wrapper({ children }: Props) {
    return <QueryClientProvider client={client}>{children}</QueryClientProvider>;
  }
  const screen = await render(<InvitationWelcome onJoined={onJoined} onLater={onLater} />, { wrapper: Wrapper });
  onTestFinished(async () => {
    await screen.unmount();
    client.clear();
  });
  return { onJoined, onLater, screen };
}

test('names who invited the new user where, with role and privacy note', async () => {
  const { screen } = await renderWelcome([invitation]);

  await expect.element(screen.getByRole('heading', { name: 'You have an invitation' })).toBeVisible();
  await expect.element(screen.getByText('Max invited you to “Family”')).toBeVisible();
  await expect.element(screen.getByText('You join as Viewer.')).toBeVisible();
  await expect.element(screen.getByText(membershipPrivacyNote)).toBeVisible();
});

test('joining opens the space', async () => {
  worker.use(
    http.post('*/api/users/me/invitations/invitation/accept', () => HttpResponse.json({ spaceId: 'family' })),
    http.get('*/api/users/me/invitations', () => HttpResponse.json([])),
  );
  const { onJoined, screen } = await renderWelcome([invitation]);

  await screen.getByRole('button', { name: 'Join Family' }).click();

  await vi.waitFor(() => expect(onJoined).toHaveBeenCalledWith('family'));
});

test('later keeps the invitation and opens the app', async () => {
  const { onJoined, onLater, screen } = await renderWelcome([invitation]);

  await screen.getByRole('button', { name: 'Later' }).click();

  expect(onLater).toHaveBeenCalledOnce();
  expect(onJoined).not.toHaveBeenCalled();
});

test('continues when the invitations are gone meanwhile', async () => {
  const { onLater, screen } = await renderWelcome([]);

  await screen.getByRole('button', { name: 'Continue' }).click();

  expect(onLater).toHaveBeenCalledOnce();
});
