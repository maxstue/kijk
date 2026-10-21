import { QueryClient } from '@tanstack/react-query';
import { expect, test, vi } from 'vite-plus/test';

import { queryKeys } from '../query-keys';
import { updateMutationOptions } from './options';
import { update } from './requests';

vi.mock('./requests', { spy: true });

test('renaming a category refreshes import review rows and previews', async () => {
  const client = new QueryClient();
  const selected = [queryKeys.imports.candidates('space', 'import'), queryKeys.imports.aiPreview('space', 'import')];
  for (const key of selected) {
    client.setQueryData(key, []);
  }
  const other = queryKeys.imports.aiPreview('other', 'import');
  client.setQueryData(other, []);
  vi.mocked(update).mockResolvedValue({ id: 'category' } as Awaited<ReturnType<typeof update>>);
  await client
    .getMutationCache()
    .build(client, updateMutationOptions('space'))
    .execute({
      id: 'category',
      data: { name: 'New name', color: '#112233', icon: 'circle', kind: 'Expense' },
    });
  for (const key of selected) {
    expect(client.getQueryState(key)?.isInvalidated).toBe(true);
  }
  expect(client.getQueryState(other)?.isInvalidated).toBe(false);
  client.clear();
});
