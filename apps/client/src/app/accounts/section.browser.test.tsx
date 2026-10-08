import { TooltipProvider } from '@kijk/ui/components/tooltip';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { expect, test, vi } from 'vite-plus/test';
import { render } from 'vitest-browser-react';

import { queryKeys } from '@/shared/api/query-keys';
import { SpacePermissions } from '@/shared/api/spaces/permissions';

import { AccountsSection } from './section';

const create = vi.fn<(data: unknown, options: unknown) => void>();
vi.mock('@/app/accounts/use-mutations', () => ({
  useCreateAccount: () => ({ isPending: false, mutate: create }),
  useDeleteAccount: () => ({ isPending: false, mutate: vi.fn<() => void>() }),
  useUpdateAccount: () => ({ isPending: false, mutate: vi.fn<() => void>() }),
}));

const accounts = [
  { ibanLast4: null, id: 'cash', kind: 'Cash', name: 'Cash', visibility: 'Shared' },
  { ibanLast4: '1234', id: 'mine', kind: 'Bank', name: 'Mine', visibility: 'Private' },
];

function createClient(permissions: string[], isPersonal: boolean) {
  const client = new QueryClient({ defaultOptions: { queries: { staleTime: Infinity } } });
  client.setQueryData(queryKeys.users.me, {
    status: 'Ready',
    user: { spaces: [{ id: 'space', isActive: true, isPersonal, name: 'Space', role: { permissions } }] },
  });
  client.setQueryData(queryKeys.accounts.list(), accounts);
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
