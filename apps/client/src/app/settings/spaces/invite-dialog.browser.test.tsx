import { queryKeys } from '@kijk/api/query-keys';
import { SpaceRoleIds } from '@kijk/api/spaces/permissions';
import type { SpaceInvitation, SpaceRole } from '@kijk/api/spaces/types';
import { Dialog } from '@kijk/ui/components/dialog';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { HttpResponse, http } from 'msw';
import { expect, onTestFinished, test, vi } from 'vite-plus/test';
import { userEvent } from 'vite-plus/test/browser';
import { render } from 'vitest-browser-react';

import { worker } from '@/test/mocks/browser';

import { InviteDialog } from './invite-dialog';

const roles: SpaceRole[] = [
  { id: SpaceRoleIds.admin, name: 'Admin', permissions: [] },
  { id: SpaceRoleIds.member, name: 'Member', permissions: [] },
  { id: SpaceRoleIds.viewer, name: 'Viewer', permissions: [] },
];

function invitation(inviteeLabel: string): SpaceInvitation {
  return {
    createdAt: '2026-11-28T10:00:00Z',
    createdByName: 'Max',
    expiresAt: '2026-12-05T10:00:00Z',
    id: 'invitation',
    inviteeLabel,
    roleId: SpaceRoleIds.member,
    roleName: 'Member',
  };
}

async function renderDialog() {
  const onClose = vi.fn<() => void>();
  const client = new QueryClient({ defaultOptions: { queries: { staleTime: Infinity } } });
  client.setQueryData(queryKeys.spaces.invitations('family'), []);
  const screen = await render(
    <QueryClientProvider client={client}>
      <Dialog open>
        <InviteDialog roles={roles} spaceId='family' spaceName='Family' onClose={onClose} />
      </Dialog>
    </QueryClientProvider>,
  );
  onTestFinished(async () => {
    await screen.unmount();
    client.clear();
  });
  return { client, onClose, screen };
}

test('invites by unique name with the chosen role and refreshes the pending invitations', async () => {
  const requests: unknown[] = [];
  worker.use(
    http.post('*/api/spaces/family/invitations', async ({ request }) => {
      requests.push(await request.json());
      return HttpResponse.json(invitation('Anna#4821'));
    }),
  );
  const { client, onClose, screen } = await renderDialog();

  await screen.getByRole('textbox', { name: 'Unique name or e-mail address' }).fill(' Anna#4821 ');
  await screen.getByRole('combobox', { name: 'Role' }).click();
  await screen.getByRole('option', { name: 'Viewer' }).click();
  await expect.element(screen.getByRole('option', { name: 'Admin' })).not.toBeInTheDocument();
  await screen.getByRole('button', { name: 'Send invitation' }).click();

  await expect.poll(() => onClose.mock.calls.length).toBe(1);
  expect(requests).toEqual([{ email: null, roleId: SpaceRoleIds.viewer, uniqueName: 'Anna#4821' }]);
  expect(client.getQueryState(queryKeys.spaces.invitations('family'))?.isInvalidated).toBe(true);
});

test('reports an unknown unique name at the field and keeps the dialog open', async () => {
  worker.use(
    http.post('*/api/spaces/family/invitations', () =>
      HttpResponse.json({ detail: 'Nobody has this unique name', status: 404, title: 'Not Found' }, { status: 404 }),
    ),
  );
  const { onClose, screen } = await renderDialog();

  await screen.getByRole('textbox', { name: 'Unique name or e-mail address' }).fill('Nobody#0001');
  await screen.getByRole('button', { name: 'Send invitation' }).click();

  await expect.element(screen.getByText('Nobody has this unique name')).toBeVisible();
  await expect
    .element(screen.getByRole('textbox', { name: 'Unique name or e-mail address' }))
    .toHaveAttribute('aria-invalid', 'true');
  expect(onClose).not.toHaveBeenCalled();
});

test('invites by e-mail address with the default member role', async () => {
  const requests: unknown[] = [];
  worker.use(
    http.post('*/api/spaces/family/invitations', async ({ request }) => {
      requests.push(await request.json());
      return HttpResponse.json(invitation('an***@ex***.com'));
    }),
  );
  const { onClose, screen } = await renderDialog();

  await expect.element(screen.getByText(/must sign up with exactly this address/)).toBeVisible();
  await screen.getByRole('textbox', { name: 'Unique name or e-mail address' }).fill('anna@example.com');
  await userEvent.keyboard('{Enter}');

  await expect.poll(() => onClose.mock.calls.length).toBe(1);
  expect(requests).toEqual([{ email: 'anna@example.com', roleId: SpaceRoleIds.member, uniqueName: null }]);
});

test('validates the invitee before calling the API', async () => {
  let called = false;
  worker.use(
    http.post('*/api/spaces/family/invitations', () => {
      called = true;
      return HttpResponse.json(invitation('x'));
    }),
  );
  const { screen } = await renderDialog();
  const input = screen.getByRole('textbox', { name: 'Unique name or e-mail address' });

  await screen.getByRole('button', { name: 'Send invitation' }).click();
  await expect.element(screen.getByText('Enter a unique name or an e-mail address')).toBeVisible();

  await input.fill('Anna');
  await screen.getByRole('button', { name: 'Send invitation' }).click();
  await expect.element(screen.getByText('A unique name looks like Max#4821')).toBeVisible();

  await input.fill('anna@');
  await screen.getByRole('button', { name: 'Send invitation' }).click();
  await expect.element(screen.getByText('Enter a valid e-mail address')).toBeVisible();
  expect(called).toBe(false);
});
