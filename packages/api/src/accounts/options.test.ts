import { QueryClient } from '@tanstack/react-query';
import { expect, test, vi } from 'vite-plus/test';

import { queryKeys } from '../query-keys';
import { updateAccountMutationOptions } from './options';
import { updateAccount } from './requests';

vi.mock('./requests', { spy: true });

test('renaming an account refreshes its name in imports', async () => {
  const client = new QueryClient();
  const selected = queryKeys.imports.detail('space', 'import');
  const other = queryKeys.imports.detail('other', 'import');
  client.setQueryData(selected, { accountName: 'Old name' });
  client.setQueryData(other, { accountName: 'Other' });
  vi.mocked(updateAccount).mockResolvedValue({ id: 'account' } as Awaited<ReturnType<typeof updateAccount>>);
  await client
    .getMutationCache()
    .build(client, updateAccountMutationOptions('space'))
    .execute({
      id: 'account',
      data: { name: 'New name', ibanLast4: null, visibility: null },
    });
  expect(client.getQueryState(selected)?.isInvalidated).toBe(true);
  expect(client.getQueryState(other)?.isInvalidated).toBe(false);
  client.clear();
});
