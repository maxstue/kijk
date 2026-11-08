import { QueryClient, QueryObserver } from '@tanstack/react-query';
import { expect, test, vi } from 'vite-plus/test';

import { queryKeys } from '../query-keys';
import {
  candidatesQueryOptions,
  resetOverridesMutationOptions,
  detailsQueryOptions,
  startCategorizationMutationOptions,
  updateCandidateMutationOptions,
} from './options';
import { getDetails, resetOverrides, startCategorization, updateCandidate } from './requests';
import type { ImportCandidate, ImportCandidatePage, ImportJob } from './types';

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
  return {
    id,
    bookingDate: '2026-10-15',
    errors: null,
    excluded: false,
    isCardSettlement: false,
  } as ImportCandidate;
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
      .build(client, updateCandidateMutationOptions('space', 'import'))
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

test.each([false, true])(
  'AI completion reloads candidates without relying on a rendered intermediate status (polling: %s)',
  async (needsPolling) => {
    const client = new QueryClient({
      defaultOptions: { queries: { staleTime: Infinity, retry: false } },
    });
    const accepted = { id: 'import', status: 'Categorizing', aiCategorizedCount: 0 } as ImportJob;
    const completed = { ...accepted, status: 'NeedsReview', aiCategorizedCount: 1 } as ImportJob;
    const detail = detailsQueryOptions('space', 'import');
    const first = candidatesQueryOptions('space', 'import', { page: 1 });
    const second = candidatesQueryOptions('space', 'import', { page: 2 });
    const other = candidatesQueryOptions('space', 'other-import');
    const otherSpace = candidatesQueryOptions('other-space', 'import');
    const initialPage = cachedPage([{ ...row('row'), categoryId: null }]);
    for (const key of [first.queryKey, second.queryKey, other.queryKey, otherSpace.queryKey]) {
      client.setQueryData(key, initialPage);
    }
    client.setQueryData(detail.queryKey, { ...completed, aiCategorizedCount: 0 });
    const preview = queryKeys.imports.aiPreview('space', 'import');
    client.setQueryData(preview, { items: [] });
    const updatedPage = cachedPage([{ ...row('row'), categoryId: 'food', categorySource: 'Ai' }]);
    const loadPage = vi.fn<() => Promise<ImportCandidatePage>>().mockResolvedValue(updatedPage);
    const pageObserver = new QueryObserver(client, { ...first, queryFn: loadPage });
    const detailObserver = new QueryObserver(client, detail);
    const unsubscribePage = pageObserver.subscribe(() => {});
    const unsubscribeDetail = detailObserver.subscribe(() => {});
    vi.mocked(startCategorization).mockResolvedValue(accepted);
    vi.mocked(getDetails)
      .mockResolvedValueOnce(needsPolling ? accepted : completed)
      .mockResolvedValue(completed);
    try {
      await client
        .getMutationCache()
        .build(client, startCategorizationMutationOptions('space', 'import'))
        .execute({ aiDataSharing: 'Strict', selectedTextKeys: ['text'] });
      expect(client.getQueryData<ImportJob>(detail.queryKey)?.status).toBe(
        needsPolling ? 'Categorizing' : 'NeedsReview',
      );
      expect(loadPage).toHaveBeenCalledTimes(needsPolling ? 0 : 1);
      if (needsPolling) {
        await detailObserver.refetch();
      }
      expect(loadPage).toHaveBeenCalledOnce();
      expect(client.getQueryData(first.queryKey)).toEqual(updatedPage);
      expect(client.getQueryData(detail.queryKey)).toEqual(completed);
      expect(client.getQueryState(second.queryKey)?.isInvalidated).toBe(true);
      expect(client.getQueryState(preview)?.isInvalidated).toBe(true);
      expect(client.getQueryState(other.queryKey)?.isInvalidated).toBe(false);
      expect(client.getQueryState(otherSpace.queryKey)?.isInvalidated).toBe(false);
    } finally {
      unsubscribePage();
      unsubscribeDetail();
      client.clear();
    }
  },
);

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
      .build(client, updateCandidateMutationOptions('space', 'import'))
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

test('row edits stay pending for their import until active review pages finish refreshing', async () => {
  const client = new QueryClient({ defaultOptions: { queries: { staleTime: Infinity } } });
  const pageOptions = candidatesQueryOptions('space', 'import');
  const candidate = row('row');
  client.setQueryData(pageOptions.queryKey, cachedPage([candidate]));
  const refresh = Promise.withResolvers<ImportCandidatePage>();
  const loadPage = vi.fn<() => Promise<ImportCandidatePage>>(() => refresh.promise);
  const observer = new QueryObserver(client, { ...pageOptions, queryFn: loadPage });
  const unsubscribe = observer.subscribe(() => {});
  const update = Promise.withResolvers<ImportCandidate>();
  vi.mocked(updateCandidate).mockReturnValue(update.promise);
  const mutationOptions = updateCandidateMutationOptions('space', 'import');
  const mutation = client.getMutationCache().build(client, mutationOptions);
  const execution = mutation.execute({
    importId: 'import',
    candidateId: candidate.id,
    candidate: { categoryId: null, excluded: true },
  });
  const updated = { ...candidate, excluded: true };
  try {
    await vi.waitFor(() => expect(mutation.state.status).toBe('pending'));
    expect(client.isMutating({ mutationKey: mutationOptions.mutationKey })).toBe(1);
    expect(
      client.isMutating({
        mutationKey: updateCandidateMutationOptions('space', 'other-import').mutationKey,
      }),
    ).toBe(0);
    expect(
      client.isMutating({
        mutationKey: updateCandidateMutationOptions('other-space', 'import').mutationKey,
      }),
    ).toBe(0);
    update.resolve(updated);
    await vi.waitFor(() => expect(loadPage).toHaveBeenCalledOnce());
    expect(mutation.state.status).toBe('pending');
    expect(client.isMutating({ mutationKey: mutationOptions.mutationKey })).toBe(1);
    refresh.resolve(cachedPage([updated]));
    await execution;
    expect(client.isMutating({ mutationKey: mutationOptions.mutationKey })).toBe(0);
    expect(client.getQueryData(pageOptions.queryKey)).toEqual(cachedPage([updated]));
  } finally {
    update.resolve(updated);
    refresh.resolve(cachedPage([updated]));
    await execution;
    unsubscribe();
    client.clear();
  }
});

test('resetting manual overrides invalidates all pages and the sharing preview of only that import', async () => {
  const client = new QueryClient({ defaultOptions: { queries: { staleTime: Infinity } } });
  const keys = [
    candidatesQueryOptions('space', 'import', { page: 1 }).queryKey,
    candidatesQueryOptions('space', 'import', { page: 2, months: '2026-11-01' }).queryKey,
    queryKeys.imports.aiPreview('space', 'import'),
  ];
  const other = candidatesQueryOptions('other-space', 'import').queryKey;
  for (const key of [...keys, other]) {
    client.setQueryData(key, {});
  }
  vi.mocked(resetOverrides).mockResolvedValue(123);
  try {
    const count = await client
      .getMutationCache()
      .build(client, resetOverridesMutationOptions('space', 'import'))
      .execute(undefined);
    expect(count).toBe(123);
    expect(resetOverrides).toHaveBeenCalledWith('space', 'import');
    for (const key of keys) {
      expect(client.getQueryState(key)?.isInvalidated).toBe(true);
    }
    expect(client.getQueryState(other)?.isInvalidated).toBe(false);
  } finally {
    client.clear();
  }
});
