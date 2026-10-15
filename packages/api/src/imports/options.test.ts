import { QueryClient } from '@tanstack/react-query';
import { expect, test, vi } from 'vite-plus/test';

import { queryKeys } from '../query-keys';
import { importCandidatesQueryOptions, updateImportCandidateMutationOptions } from './options';
import { updateImportCandidate } from './requests';
import type { ImportCandidate, ImportCandidatePage } from './types';

vi.mock('./requests', { spy: true });

function cachedPage(items: ImportCandidate[], totalCount = 200): ImportCandidatePage {
  return {
    items,
    totalCount,
    includedCount: totalCount,
    cardSettlementCount: 0,
    page: 1,
    pageSize: 100,
    errorCount: 0,
    errorSamples: [],
  };
}

function row(id: string, bookingDate = '2026-10-15'): ImportCandidate {
  return { id, bookingDate, errors: null, excluded: false, isCardSettlement: false } as ImportCandidate;
}

test('excluding a row on page two updates totals on every matching page without refetching them', async () => {
  const client = new QueryClient({ defaultOptions: { queries: { staleTime: Infinity } } });
  const firstKey = importCandidatesQueryOptions('space', 'import', { months: '2026-10-01', page: 1 }).queryKey;
  const secondKey = importCandidatesQueryOptions('space', 'import', { months: '2026-10-01', page: 2 }).queryKey;
  const otherMonthKey = importCandidatesQueryOptions('space', 'import', { months: '2026-09-01' }).queryKey;
  const first = row('first');
  const second = row('second');
  const updated = { ...second, excluded: true };
  client.setQueryData(firstKey, cachedPage([first]));
  client.setQueryData(secondKey, { ...cachedPage([second]), page: 2 });
  client.setQueryData(otherMonthKey, cachedPage([row('september', '2026-09-15')], 1));
  client.setQueryData(queryKeys.imports.aiPreview('space', 'import'), { items: [] });
  vi.mocked(updateImportCandidate).mockResolvedValue(updated);

  await client
    .getMutationCache()
    .build(client, updateImportCandidateMutationOptions('space'))
    .execute({
      importId: 'import',
      candidateId: 'second',
      candidate: { categoryId: null, excluded: true },
    });

  expect(client.getQueryData(firstKey)).toMatchObject({ items: [first], includedCount: 199, totalCount: 200 });
  expect(client.getQueryData(secondKey)).toMatchObject({ items: [updated], includedCount: 199, page: 2 });
  expect(client.getQueryData(otherMonthKey)).toMatchObject({ includedCount: 1 });
  expect(client.getQueryState(firstKey)?.isInvalidated).toBe(false);
  expect(client.getQueryState(secondKey)?.isInvalidated).toBe(false);
  expect(client.getQueryState(queryKeys.imports.aiPreview('space', 'import'))?.isInvalidated).toBe(true);
  client.clear();
});

test('excluding a card statement refreshes card pages to fill the resulting gap', async () => {
  const client = new QueryClient();
  const candidate = { ...row('card'), isCardSettlement: true };
  const key = importCandidatesQueryOptions('space', 'import', { months: '2026-10-01', cardSettlementsOnly: true }).queryKey;
  client.setQueryData(key, { ...cachedPage([candidate], 1), cardSettlementCount: 1 });
  vi.mocked(updateImportCandidate).mockResolvedValue({ ...candidate, excluded: true });

  await client
    .getMutationCache()
    .build(client, updateImportCandidateMutationOptions('space'))
    .execute({
      importId: 'import',
      candidateId: 'card',
      candidate: { categoryId: null, excluded: true },
    });

  expect(client.getQueryData(key)).toMatchObject({
    items: [],
    totalCount: 0,
    includedCount: 0,
    cardSettlementCount: 0,
  });
  expect(client.getQueryState(key)?.isInvalidated).toBe(true);
  client.clear();
});
