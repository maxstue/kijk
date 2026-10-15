import { queryKeys } from '@kijk/api/query-keys';
import { currentUserQueryOptions } from '@kijk/api/users/options';
import { setDefaultSpace } from '@kijk/api/users/requests';
import type { CurrentUser, ReadyCurrentUser } from '@kijk/api/users/types';
import { QueryClient, QueryClientProvider, useQuery } from '@tanstack/react-query';
import { afterEach, expect, test, vi } from 'vite-plus/test';
import { render } from 'vitest-browser-react';

import { DefaultSpaceSelect } from './default-space-select';

vi.mock('@kijk/api/users/requests', { spy: true });
afterEach(() => vi.mocked(setDefaultSpace).mockReset());

const spaces = [
  { id: 'personal', name: 'Personal', isDefault: true, isPersonal: true },
  { id: 'shared', name: 'Family', isDefault: false, isPersonal: false },
] as NonNullable<ReadyCurrentUser['spaces']>;

function Settings() {
  const { data } = useQuery(currentUserQueryOptions());
  return <DefaultSpaceSelect spaces={data?.user?.spaces ?? []} />;
}

test('selects and clears the default while staying in account settings', async () => {
  const client = new QueryClient({ defaultOptions: { queries: { staleTime: Infinity } } });
  client.setQueryData(queryKeys.users.me, { status: 'Ready', user: { spaces } });
  vi.mocked(setDefaultSpace).mockImplementation(
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
  await screen.getByRole('combobox', { name: 'Default space' }).click();
  await screen.getByRole('option', { name: 'Family', exact: true }).click();
  await expect.element(screen.getByRole('combobox')).toHaveTextContent('Family');
  expect(setDefaultSpace).toHaveBeenCalledWith('shared');
  await screen.getByRole('combobox').click();
  await screen.getByRole('option', { name: 'None — use the last visited space' }).click();
  await expect.element(screen.getByRole('combobox')).toHaveTextContent('None — use the last visited space');
  expect(setDefaultSpace).toHaveBeenLastCalledWith(null);
  await screen.unmount();
  client.clear();
});
