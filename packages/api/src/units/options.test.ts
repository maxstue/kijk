import { QueryClient } from '@tanstack/react-query';
import { expect, test, vi } from 'vite-plus/test';

import { queryKeys } from '../query-keys';
import { shareUnitMutationOptions } from './options';
import { shareUnit } from './requests';

vi.mock('./requests', { spy: true });

test('sharing a unit refreshes that space and personal units while retaining other spaces', async () => {
  const client = new QueryClient();
  const personal = queryKeys.units.list({ scope: 'Personal' });
  const selected = queryKeys.units.list({ scope: 'Space', spaceId: 'selected' });
  const other = queryKeys.units.list({ scope: 'Space', spaceId: 'other' });
  for (const key of [personal, selected, other]) {
    client.setQueryData(key, []);
  }
  vi.mocked(shareUnit).mockResolvedValue();
  await client
    .getMutationCache()
    .build(client, shareUnitMutationOptions())
    .execute({ id: 'unit', spaceId: 'selected' });
  expect(client.getQueryState(personal)?.isInvalidated).toBe(true);
  expect(client.getQueryState(selected)?.isInvalidated).toBe(true);
  expect(client.getQueryState(other)?.isInvalidated).toBe(false);
  client.clear();
});
