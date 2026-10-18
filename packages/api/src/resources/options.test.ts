import { QueryClient } from '@tanstack/react-query';
import { expect, test, vi } from 'vite-plus/test';

import { queryKeys } from '../query-keys';
import { updateResourceMutationOptions } from './options';
import { updateResource } from './requests';

vi.mock('./requests', { spy: true });

test('changing a resource unit refreshes its converted limits without touching other spaces', async () => {
  const client = new QueryClient();
  client.setQueryData(queryKeys.limits.list('space'), [{ limit: 1000, resource: { unit: 'l' } }]);
  client.setQueryData(queryKeys.limits.list('other'), []);
  vi.mocked(updateResource).mockResolvedValue({ id: 'water' } as Awaited<ReturnType<typeof updateResource>>);
  await client
    .getMutationCache()
    .build(client, updateResourceMutationOptions('space'))
    .execute({ id: 'water', resource: { name: null, color: null, icon: null, unitId: 'cubic-meter' } });
  expect(client.getQueryState(queryKeys.limits.list('space'))?.isInvalidated).toBe(true);
  expect(client.getQueryState(queryKeys.limits.list('other'))?.isInvalidated).toBe(false);
  client.clear();
});
