import { invalidate } from '@kijk/api/cache';
import { queryKeys } from '@kijk/api/query-keys';
import { mutationOptions, queryOptions } from '@tanstack/react-query';

import {
  cancelImport,
  categorizeImport,
  commitImport,
  confirmImportMapping,
  createImport,
  getImport,
  getImportAiPreview,
  getImportCandidates,
  getImportPreview,
  getImportSettings,
  getImports,
  updateImportCandidate,
  updateImportSettings,
} from './requests';
import type {
  CategorizeImportRequest,
  CommitImportRequest,
  CreateImportData,
  CsvImportMapping,
  ImportJobStatus,
  ImportCandidatePage,
  ImportCandidatesQuery,
  ImportPreviewParams,
  UpdateImportCandidateData,
  UpdateImportSettingsRequest,
} from './types';

const processingStatuses: ImportJobStatus[] = ['Pending', 'Analyzing', 'Reading', 'Categorizing'];
const pollIntervalMs = 1500;

/** Returns whether the import is processed in the background, so its state should be polled. */
export const isImportProcessing = (status: ImportJobStatus | undefined) =>
  status !== undefined && processingStatuses.includes(status);

/** Query for the latest imports of the active space. */
export const importsQueryOptions = () =>
  queryOptions({
    queryFn: ({ signal }) => getImports(signal),
    queryKey: queryKeys.imports.list(),
  });

/** Query for an import; polls while the background job works on it. */
export const importQueryOptions = (id: string) =>
  queryOptions({
    queryFn: ({ signal }) => getImport(id, signal),
    queryKey: queryKeys.imports.detail(id),
    refetchInterval: (query) => (isImportProcessing(query.state.data?.status) ? pollIntervalMs : false),
  });

/** Query for the first rows of an uploaded file. */
export const importPreviewQueryOptions = (id: string, params: ImportPreviewParams) =>
  queryOptions({
    queryFn: ({ signal }) => getImportPreview(id, params, signal),
    queryKey: queryKeys.imports.preview(id, params),
  });

/** Query for one page of review rows and totals for the complete selected period. */
export const importCandidatesQueryOptions = (id: string, params: ImportCandidatesQuery = {}) => {
  const query = {
    ...params,
    page: params.page ?? 1,
    pageSize: params.pageSize ?? 100,
    cardSettlementsOnly: params.cardSettlementsOnly ?? false,
  };
  return queryOptions({
    queryFn: ({ signal }) => getImportCandidates(id, query, signal),
    queryKey: queryKeys.imports.candidatesPage(id, query),
  });
};

/** Query for the texts the AI categorization of an import would send. */
export const importAiPreviewQueryOptions = (id: string) =>
  queryOptions({
    queryFn: ({ signal }) => getImportAiPreview(id, signal),
    queryKey: queryKeys.imports.aiPreview(id),
  });

/** Query for the import settings of the active space. */
export const importSettingsQueryOptions = (spaceId?: string) =>
  queryOptions({
    queryFn: ({ signal }) => getImportSettings(signal, spaceId),
    queryKey: queryKeys.imports.settings(spaceId),
  });

/** Mutation that uploads a bank export. */
export const createImportMutationOptions = () =>
  mutationOptions({
    mutationFn: (data: CreateImportData) => createImport(data),
    onSuccess: (_data, _variables, _result, { client }) => invalidate(client, queryKeys.imports.list()),
  });

/** Mutation that confirms a column mapping. */
export const confirmImportMappingMutationOptions = (id: string) =>
  mutationOptions({
    mutationFn: (mapping: CsvImportMapping) => confirmImportMapping(id, mapping),
    onSuccess: (_data, _variables, _result, { client }) => invalidate(client, queryKeys.imports.detail(id)),
  });

/** Mutation that changes a row during the review. */
export const updateImportCandidateMutationOptions = () =>
  mutationOptions({
    mutationFn: (data: UpdateImportCandidateData) => updateImportCandidate(data),
    onSuccess: async (data, { importId }, _result, { client }) => {
      // Prevent a list request started before this edit from overwriting the updated row.
      await client.cancelQueries({ queryKey: queryKeys.imports.candidates(importId) });
      const pages = client.getQueriesData<ImportCandidatePage>({ queryKey: queryKeys.imports.candidates(importId) });
      const previous = pages.flatMap(([, page]) => page?.items ?? []).find((candidate) => candidate.id === data.id);
      if (!previous) {
        await invalidate(client, queryKeys.imports.candidates(importId), queryKeys.imports.aiPreview(importId));
        return;
      }
      const includedDelta =
        Number(!data.excluded && data.errors === null) - Number(!previous.excluded && previous.errors === null);
      const cardDelta = data.isCardSettlement ? includedDelta : 0;
      const month = `${data.bookingDate?.slice(0, 7)}-01`;
      const changedCardPages: Array<readonly unknown[]> = [];
      for (const [key, page] of pages) {
        const params = key[3] as ImportCandidatesQuery;
        if (!page || (params.months !== undefined && !params.months.split(',').includes(month))) {
          continue;
        }
        client.setQueryData<ImportCandidatePage>(key, {
          ...page,
          items: page.items
            .map((candidate) => (candidate.id === data.id ? data : candidate))
            .filter((candidate) => !params.cardSettlementsOnly || !candidate.excluded),
          includedCount: Number(page.includedCount) + includedDelta,
          cardSettlementCount: Number(page.cardSettlementCount) + cardDelta,
          totalCount: Number(page.totalCount) + (params.cardSettlementsOnly ? cardDelta : 0),
        });
        if (params.cardSettlementsOnly && cardDelta !== 0) {
          changedCardPages.push(key);
        }
      }
      await invalidate(client, queryKeys.imports.aiPreview(importId), ...changedCardPages);
    },
  });

/** Mutation that commits an import. */
export const commitImportMutationOptions = (id: string) =>
  mutationOptions({
    mutationFn: (data: CommitImportRequest) => commitImport(id, data),
    onSuccess: (_data, _variables, _result, { client }) =>
      invalidate(client, queryKeys.imports.all, queryKeys.transactions.all, queryKeys.budgets.all),
  });

/** Mutation that cancels an import. */
export const cancelImportMutationOptions = (id: string) =>
  mutationOptions({
    mutationFn: () => cancelImport(id),
    onSuccess: (_data, _variables, _result, { client }) => invalidate(client, queryKeys.imports.all),
  });

/** Mutation that changes the import settings. */
export const updateImportSettingsMutationOptions = (spaceId?: string) =>
  mutationOptions({
    mutationFn: (data: UpdateImportSettingsRequest) => updateImportSettings(data, spaceId),
    onSuccess: (_data, _variables, _result, { client }) => invalidate(client, queryKeys.imports.settings()),
  });

/** Mutation that lets the AI propose categories for the rows without one. */
export const categorizeImportMutationOptions = (id: string) =>
  mutationOptions({
    mutationFn: (data: CategorizeImportRequest) => categorizeImport(id, data),
    onSuccess: (_data, _variables, _result, { client }) => invalidate(client, queryKeys.imports.detail(id)),
  });
