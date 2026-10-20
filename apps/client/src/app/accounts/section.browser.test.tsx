import { queryKeys } from '@kijk/api/query-keys';
import { SpacePermissions } from '@kijk/api/spaces/permissions';
import { TooltipProvider } from '@kijk/ui/components/tooltip';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { expect, test } from 'vitest';

import { render } from '@/test/render-space';

import { AccountsSection } from './section';

const accounts = [
  { ibanLast4: null, id: 'cash', kind: 'Cash', name: 'Cash', visibility: 'Shared' },
  { ibanLast4: '1234', id: 'mine', kind: 'Bank', name: 'Mine', visibility: 'Private' },
];

function createClient(permissions: string[], isPersonal: boolean) {
  const client = new QueryClient({ defaultOptions: { queries: { staleTime: Infinity } } });
  client.setQueryData(queryKeys.users.me, {
    status: 'Ready',
    user: { spaces: [{ id: 'space', isDefault: true, isPersonal, name: 'Space', role: { permissions } }] },
  });
  client.setQueryData(queryKeys.accounts.list('space'), accounts);
  return client;
}

test('members keep private accounts and cannot add shared ones', async () => {
  const client = createClient([SpacePermissions.finances.view, SpacePermissions.finances.record], false);
  const screen = await render(
    <QueryClientProvider client={client}>
      <TooltipProvider>
        <AccountsSection />
      </TooltipProvider>
    </QueryClientProvider>,
  );

  await expect.element(screen.getByText('Private', { exact: true })).toBeVisible();
  await screen.getByRole('button', { name: 'Add account' }).click();
  await expect.element(screen.getByRole('combobox')).toHaveTextContent('Private, only for me');
  await screen.getByRole('combobox').click();
  await expect
    .element(screen.getByRole('option', { name: 'Shared with the space' }))
    .toHaveAttribute('aria-disabled', 'true');
  await screen.unmount();
  client.clear();
});

test('a personal space offers no visibility choice', async () => {
  const client = createClient(Object.values(SpacePermissions.finances), true);
  const screen = await render(
    <QueryClientProvider client={client}>
      <TooltipProvider>
        <AccountsSection />
      </TooltipProvider>
    </QueryClientProvider>,
  );

  await expect.element(screen.getByText('Private', { exact: true })).not.toBeInTheDocument();
  await screen.getByRole('button', { name: 'Add account' }).click();
  await expect.element(screen.getByLabelText('Name')).toBeVisible();
  await expect.element(screen.getByRole('combobox')).not.toBeInTheDocument();
  await screen.unmount();
  client.clear();
});

test('a row menu opens the update dialog and closes its menu', async () => {
  const client = createClient(Object.values(SpacePermissions.finances), true);
  const screen = await render(
    <QueryClientProvider client={client}>
      <TooltipProvider>
        <AccountsSection />
      </TooltipProvider>
    </QueryClientProvider>,
  );

  await screen.getByRole('row', { name: /Mine/ }).getByRole('button', { name: 'Open menu' }).click();
  await screen.getByRole('menuitem', { name: 'Update', exact: true }).click();
  await expect.element(screen.getByRole('heading', { name: 'Update Mine' })).toBeVisible();
  await expect.element(screen.getByLabelText('Name')).toHaveValue('Mine');
  await expect.element(screen.getByRole('menu')).not.toBeInTheDocument();
  await screen.getByRole('button', { name: 'Close', exact: true }).click();
  await expect.element(screen.getByRole('dialog')).not.toBeInTheDocument();
  await screen.unmount();
  client.clear();
});
