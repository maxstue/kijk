import { queryKeys } from '@kijk/api/query-keys';
import * as usersOptions from '@kijk/api/users/options';
import * as usersApi from '@kijk/api/users/requests';
import type { CurrentUser, ReadyCurrentUser } from '@kijk/api/users/types';
import { QueryClient, QueryClientProvider, useQuery } from '@tanstack/react-query';
import { afterEach, expect, test, vi } from 'vite-plus/test';
import { render } from 'vitest-browser-react';

import { DefaultSpaceSelect } from './default-space-select';

vi.mock('@kijk/api/users/requests', { spy: true });
afterEach(() => vi.mocked(usersApi.setDefaultSpace).mockReset());

const spaces = [
  { id: 'personal', name: 'Personal', isDefault: true, isPersonal: true },
  { id: 'shared', name: 'Family', isDefault: false, isPersonal: false },
] as NonNullable<ReadyCurrentUser['spaces']>;

function Settings() {
  const { data } = useQuery(usersOptions.meQueryOptions());
  return <DefaultSpaceSelect spaces={data?.user?.spaces ?? []} />;
}

test('selects and clears the default while staying in account settings', async () => {
  const client = new QueryClient({ defaultOptions: { queries: { staleTime: Infinity } } });
  client.setQueryData(queryKeys.users.me, { status: 'Ready', user: { spaces } });
  vi.mocked(usersApi.setDefaultSpace).mockImplementation(
    async (spaceId) =>
      ({
        status: 'Ready',
        user: { spaces: spaces.map((space) => ({ ...space, isDefault: space.id === spaceId })) },
      }) as CurrentUser,
  );
  const screen = await render(
    <QueryClientProvider client={client}>
      <Settings />
    </QueryClientProvider>,
  );
  await expect.element(screen.getByRole('combobox', { name: 'Default space' })).toHaveTextContent('Personal');
  await screen.getByText('Default space', { exact: true }).click();
  await expect.element(screen.getByRole('option', { name: 'Family', exact: true })).toBeVisible();
  await screen.getByRole('option', { name: 'Family', exact: true }).click();
  await expect.element(screen.getByRole('combobox')).toHaveTextContent('Family');
  expect(usersApi.setDefaultSpace).toHaveBeenCalledWith('shared');
  await screen.getByRole('combobox').click();
  await screen.getByRole('option', { name: 'None — use the last visited space' }).click();
  await expect.element(screen.getByRole('combobox')).toHaveTextContent('None — use the last visited space');
  expect(usersApi.setDefaultSpace).toHaveBeenLastCalledWith(null);
  await screen.unmount();
  client.clear();
});
