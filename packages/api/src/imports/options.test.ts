import { QueryClient, QueryObserver } from '@tanstack/react-query';
import { expect, test, vi } from 'vite-plus/test';

import { queryKeys } from '../query-keys';
import { candidatesQueryOptions, updateCandidateMutationOptions } from './options';
import { updateCandidate } from './requests';
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

function row(id: string): ImportCandidate {
  return { id, bookingDate: '2026-10-15', errors: null, excluded: false, isCardSettlement: false } as ImportCandidate;
}

test('editing a row reloads active pages and totals from the server and marks other pages stale', async () => {
  const client = new QueryClient({ defaultOptions: { queries: { staleTime: Infinity } } });
  const first = candidatesQueryOptions('space', 'import', { page: 1 });
  const second = candidatesQueryOptions('space', 'import', { page: 2 });
  const other = candidatesQueryOptions('space', 'other-import');
  const otherSpace = candidatesQueryOptions('other-space', 'import');
  for (const key of [first.queryKey, second.queryKey, other.queryKey, otherSpace.queryKey]) {
    client.setQueryData(key, cachedPage([row('row')]));
  }
  const preview = queryKeys.imports.aiPreview('space', 'import');
  client.setQueryData(preview, { items: [] });
  const updated = { ...row('row'), excluded: true };
  const serverPage = { ...cachedPage([updated]), includedCount: 197, page: 2 };
  const loadPage = vi.fn<() => Promise<ImportCandidatePage>>().mockResolvedValue(serverPage);
  const observer = new QueryObserver(client, { ...second, queryFn: loadPage });
  const unsubscribe = observer.subscribe(() => {});
  vi.mocked(updateCandidate).mockResolvedValue(updated);
  try {
    await client
      .getMutationCache()
      .build(client, updateCandidateMutationOptions('space'))
      .execute({
        importId: 'import',
        candidateId: 'row',
        candidate: { categoryId: null, excluded: true },
      });

    expect(loadPage).toHaveBeenCalledTimes(1);
    expect(client.getQueryData(second.queryKey)).toEqual(serverPage);
    expect(client.getQueryState(first.queryKey)?.isInvalidated).toBe(true);
    expect(client.getQueryState(preview)?.isInvalidated).toBe(true);
    expect(client.getQueryState(other.queryKey)?.isInvalidated).toBe(false);
    expect(client.getQueryState(otherSpace.queryKey)?.isInvalidated).toBe(false);
  } finally {
    unsubscribe();
    client.clear();
  }
});

test('excluding a card statement reloads the server page including any replacement row', async () => {
  const client = new QueryClient({ defaultOptions: { queries: { staleTime: Infinity } } });
  const candidate = { ...row('card'), isCardSettlement: true };
  const options = candidatesQueryOptions('space', 'import', { cardSettlementsOnly: true });
  client.setQueryData(options.queryKey, { ...cachedPage([candidate], 2), cardSettlementCount: 2 });
  const replacement = { ...candidate, id: 'next-card' };
  const serverPage = { ...cachedPage([replacement], 1), cardSettlementCount: 1 };
  const observer = new QueryObserver(client, { ...options, queryFn: async () => serverPage });
  const unsubscribe = observer.subscribe(() => {});
  vi.mocked(updateCandidate).mockResolvedValue({ ...candidate, excluded: true });
  try {
    await client
      .getMutationCache()
      .build(client, updateCandidateMutationOptions('space'))
      .execute({
        importId: 'import',
        candidateId: 'card',
        candidate: { categoryId: null, excluded: true },
      });
    expect(client.getQueryData(options.queryKey)).toEqual(serverPage);
  } finally {
    unsubscribe();
    client.clear();
  }
});
