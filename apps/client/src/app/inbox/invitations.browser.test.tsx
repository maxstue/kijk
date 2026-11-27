import { queryKeys } from '@kijk/api/query-keys';
import type { ReceivedInvitation } from '@kijk/api/users/types';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { HttpResponse, http } from 'msw';
import type { PropsWithChildren } from 'react';
import { toast } from 'sonner';
import { expect, onTestFinished, test, vi } from 'vite-plus/test';

import { worker } from '@/test/mocks/browser';
import { render } from '@/test/render-space';

import { unavailableInvitationMessage } from './constants';
import { InboxInvitations } from './invitations';

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

interface Props extends PropsWithChildren {}

async function renderInbox(email: string | null = 'jo@example.test') {
  const client = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  const onJoined = vi.fn<(spaceId: string) => void>();
  function Wrapper({ children }: Props) {
    return <QueryClientProvider client={client}>{children}</QueryClientProvider>;
  }
  const screen = await render(<InboxInvitations email={email} onJoined={onJoined} />, { wrapper: Wrapper });
  onTestFinished(async () => {
    await screen.unmount();
    client.clear();
  });
  return { client, onJoined, screen };
}

test('joining an invitation opens the joined space and refreshes the inbox and spaces', async () => {
  let invitations = [invitation];
  const accepted: string[] = [];
  worker.use(
    http.get('*/api/users/me/invitations', () => HttpResponse.json(invitations)),
    http.post('*/api/users/me/invitations/:invitationId/accept', ({ params }) => {
      accepted.push(params.invitationId as string);
      invitations = [];
      return HttpResponse.json({ spaceId: 'family' });
    }),
  );
  const { client, onJoined, screen } = await renderInbox();
  client.setQueryData(queryKeys.users.me, { status: 'Ready' });

  await expect.element(screen.getByText('Max invited you as Member', { exact: false })).toBeVisible();
  await screen.getByRole('button', { name: 'Join Family' }).click();

  await vi.waitFor(() => expect(onJoined).toHaveBeenCalledWith('family'));
  expect(accepted).toEqual(['invitation']);
  expect(client.getQueryState(queryKeys.users.me)?.isInvalidated).toBe(true);
  expect(toast.success).toHaveBeenCalledWith('You joined Family');
  await expect.element(screen.getByText('No invitations')).toBeVisible();
});

test('declining removes the invitation without opening a space', async () => {
  let invitations = [invitation];
  worker.use(
    http.get('*/api/users/me/invitations', () => HttpResponse.json(invitations)),
    http.post('*/api/users/me/invitations/:invitationId/decline', () => {
      invitations = [];
      return new HttpResponse(null, { status: 204 });
    }),
  );
  const { onJoined, screen } = await renderInbox();

  await screen.getByRole('button', { name: 'Decline invitation to Family' }).click();

  await expect.element(screen.getByText('No invitations')).toBeVisible();
  expect(onJoined).not.toHaveBeenCalled();
});

test('an invitation that is gone meanwhile disappears with an explanation', async () => {
  let invitations = [invitation];
  worker.use(
    http.get('*/api/users/me/invitations', () => HttpResponse.json(invitations)),
    http.post('*/api/users/me/invitations/:invitationId/accept', () => {
      invitations = [];
      return HttpResponse.json({ status: 404, title: 'Not Found' }, { status: 404 });
    }),
  );
  const { onJoined, screen } = await renderInbox();

  await screen.getByRole('button', { name: 'Join Family' }).click();

  await expect.element(screen.getByText('No invitations')).toBeVisible();
  expect(toast.error).toHaveBeenCalledWith(unavailableInvitationMessage);
  expect(onJoined).not.toHaveBeenCalled();
});

test('the empty inbox names the address that e-mail invitations reach', async () => {
  worker.use(http.get('*/api/users/me/invitations', () => HttpResponse.json([])));
  const { screen } = await renderInbox('jo@example.test');

  await expect.element(screen.getByText('No invitations')).toBeVisible();
  await expect.element(screen.getByText('jo@example.test')).toBeVisible();
});

test('a failed load can be retried', async () => {
  let fail = true;
  worker.use(
    http.get('*/api/users/me/invitations', () =>
      fail ? HttpResponse.json({ status: 500 }, { status: 500 }) : HttpResponse.json([invitation]),
    ),
  );
  const { screen } = await renderInbox();

  await expect.element(screen.getByText('Your invitations could not be loaded.')).toBeVisible();
  fail = false;
  await screen.getByRole('button', { name: 'Try again' }).click();
  await expect.element(screen.getByRole('button', { name: 'Join Family' })).toBeVisible();
});
