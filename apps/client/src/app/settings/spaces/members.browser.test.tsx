import type * as Api from '@kijk/api/generated/types';
import { queryKeys } from '@kijk/api/query-keys';
import { SpacePermissions, SpaceRoleIds } from '@kijk/api/spaces/permissions';
import type { SpaceInvitation, SpaceRole } from '@kijk/api/spaces/types';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { HttpResponse, http } from 'msw';
import type { PropsWithChildren } from 'react';
import { expect, onTestFinished, test } from 'vite-plus/test';

import { worker } from '@/test/mocks/browser';
import { render } from '@/test/render-space';

import { SpaceSettingsContext } from './context';
import { SpaceMembers } from './members';

const roles: SpaceRole[] = [
  { id: SpaceRoleIds.admin, name: 'Admin', permissions: [SpacePermissions.members.invite] },
  { id: SpaceRoleIds.member, name: 'Member', permissions: [] },
  { id: SpaceRoleIds.viewer, name: 'Viewer', permissions: [] },
];

const invitation: SpaceInvitation = {
  createdAt: '2026-11-28T10:00:00Z',
  createdByName: 'Max',
  expiresAt: '2026-12-05T10:00:00Z',
  id: 'invitation',
  inviteeLabel: 'an***@gm***.com',
  roleId: SpaceRoleIds.viewer,
  roleName: 'Viewer',
};

interface SpaceOptions {
  isPersonal?: boolean;
  permissions: string[];
}

function space({ isPersonal = false, permissions }: SpaceOptions) {
  return {
    id: 'family',
    name: 'Family',
    isDefault: false,
    isPersonal,
    role: { id: SpaceRoleIds.admin, name: 'Admin', permissions },
  } as Api.UserSpaceResponse;
}

async function renderMembers(options: SpaceOptions) {
  const client = new QueryClient({ defaultOptions: { queries: { retry: false, staleTime: Infinity } } });
  client.setQueryData(queryKeys.spaces.members('family'), [
    { userId: 'me', name: 'Max', isCurrentUser: true, role: { id: SpaceRoleIds.admin, name: 'Admin' } },
  ]);
  client.setQueryData(queryKeys.spaces.roles(), roles);
  const value = { space: space(options), user: { id: 'me' } as Api.GetMeUserResponse };
  function Wrapper({ children }: PropsWithChildren) {
    return (
      <QueryClientProvider client={client}>
        <SpaceSettingsContext value={value}>{children}</SpaceSettingsContext>
      </QueryClientProvider>
    );
  }
  const screen = await render(<SpaceMembers />, { wrapper: Wrapper });
  onTestFinished(async () => {
    await screen.unmount();
    client.clear();
  });
  return screen;
}

test('admins of a shared space see the invite button and the pending invitations', async () => {
  let invitations = [invitation];
  const revoked: string[] = [];
  worker.use(
    http.get('*/api/spaces/family/invitations', () => HttpResponse.json(invitations)),
    http.delete('*/api/spaces/family/invitations/:invitationId', ({ params }) => {
      revoked.push(params.invitationId as string);
      invitations = [];
      return new HttpResponse(null, { status: 204 });
    }),
  );
  const screen = await renderMembers({ permissions: [SpacePermissions.members.invite] });

  await expect.element(screen.getByRole('button', { name: 'Invite' })).toBeVisible();
  await expect.element(screen.getByText('an***@gm***.com')).toBeVisible();
  await expect.element(screen.getByText(/Viewer · invited by Max · expires/)).toBeVisible();

  await screen.getByRole('button', { name: 'Revoke invitation for an***@gm***.com' }).click();
  await expect.element(screen.getByText('No pending invitations.')).toBeVisible();
  expect(revoked).toEqual(['invitation']);
});

test('members without the invite permission see neither the button nor the invitations', async () => {
  let requested = false;
  worker.use(
    http.get('*/api/spaces/family/invitations', () => {
      requested = true;
      return HttpResponse.json([]);
    }),
  );
  const screen = await renderMembers({ permissions: [SpacePermissions.members.view] });

  await expect.element(screen.getByRole('heading', { name: 'Members' })).toBeVisible();
  await expect.element(screen.getByRole('button', { name: 'Invite' })).not.toBeInTheDocument();
  await expect.element(screen.getByText('Pending invitations')).not.toBeInTheDocument();
  expect(requested).toBe(false);
});

test('the personal space offers no invitations, even to its admin', async () => {
  const screen = await renderMembers({ isPersonal: true, permissions: [SpacePermissions.members.invite] });

  await expect.element(screen.getByRole('heading', { name: 'Members' })).toBeVisible();
  await expect.element(screen.getByRole('button', { name: 'Invite' })).not.toBeInTheDocument();
});

test('a failed invitation list offers a retry', async () => {
  let fail = true;
  worker.use(
    http.get('*/api/spaces/family/invitations', () =>
      fail ? HttpResponse.json({ title: 'Unavailable' }, { status: 503 }) : HttpResponse.json([]),
    ),
  );
  const screen = await renderMembers({ permissions: [SpacePermissions.members.invite] });

  await expect.element(screen.getByText('The invitations could not be loaded.')).toBeVisible();
  fail = false;
  await screen.getByRole('button', { name: 'Try again' }).click();
  await expect.element(screen.getByText('No pending invitations.')).toBeVisible();
});
