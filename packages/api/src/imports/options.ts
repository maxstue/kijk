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
export const importsQueryOptions = (spaceId: string) =>
  queryOptions({
    queryFn: ({ signal }) => getImports(spaceId, signal),
    queryKey: queryKeys.imports.list(spaceId),
  });

/** Query for an import; polls while the background job works on it. */
export const importQueryOptions = (spaceId: string, id: string) =>
  queryOptions({
    queryFn: ({ signal }) => getImport(spaceId, id, signal),
    queryKey: queryKeys.imports.detail(spaceId, id),
    refetchInterval: (query) => (isImportProcessing(query.state.data?.status) ? pollIntervalMs : false),
  });

/** Query for the first rows of an uploaded file. */
export const importPreviewQueryOptions = (spaceId: string, id: string, params: ImportPreviewParams) =>
  queryOptions({
    queryFn: ({ signal }) => getImportPreview(spaceId, id, params, signal),
    queryKey: queryKeys.imports.preview(spaceId, id, params),
  });

/** Query for one page of review rows and totals for the complete selected period. */
export const importCandidatesQueryOptions = (spaceId: string, id: string, params: ImportCandidatesQuery = {}) => {
  const query = {
    ...params,
    page: params.page ?? 1,
    pageSize: params.pageSize ?? 100,
    cardSettlementsOnly: params.cardSettlementsOnly ?? false,
  };
  return queryOptions({
    queryFn: ({ signal }) => getImportCandidates(spaceId, id, query, signal),
    queryKey: queryKeys.imports.candidatesPage(spaceId, id, query),
  });
};

/** Query for the texts the AI categorization of an import would send. */
export const importAiPreviewQueryOptions = (spaceId: string, id: string) =>
  queryOptions({
    queryFn: ({ signal }) => getImportAiPreview(spaceId, id, signal),
    queryKey: queryKeys.imports.aiPreview(spaceId, id),
  });

/** Query for the import settings of a space. */
export const importSettingsQueryOptions = (spaceId: string) =>
  queryOptions({
    queryFn: ({ signal }) => getImportSettings(spaceId, signal),
    queryKey: queryKeys.imports.settings(spaceId),
  });

/** Mutation that uploads a bank export. */
export const createImportMutationOptions = (spaceId: string) =>
  mutationOptions({
    mutationFn: (data: CreateImportData) => createImport(spaceId, data),
    onSuccess: (_data, _variables, _result, { client }) => invalidate(client, queryKeys.imports.list(spaceId)),
  });

/** Mutation that confirms a column mapping. */
export const confirmImportMappingMutationOptions = (spaceId: string, id: string) =>
  mutationOptions({
    mutationFn: (mapping: CsvImportMapping) => confirmImportMapping(spaceId, id, mapping),
    onSuccess: (_data, _variables, _result, { client }) => invalidate(client, queryKeys.imports.detail(spaceId, id)),
  });

/** Mutation that changes a row during the review. */
export const updateImportCandidateMutationOptions = (spaceId: string) =>
  mutationOptions({
    mutationFn: (data: UpdateImportCandidateData) => updateImportCandidate(spaceId, data),
    onSuccess: async (data, { importId }, _result, { client }) => {
      // Prevent a list request started before this edit from overwriting the updated row.
      await client.cancelQueries({ queryKey: queryKeys.imports.candidates(spaceId, importId) });
      const pages = client.getQueriesData<ImportCandidatePage>({
        queryKey: queryKeys.imports.candidates(spaceId, importId),
      });
      const previous = pages.flatMap(([, page]) => page?.items ?? []).find((candidate) => candidate.id === data.id);
      if (!previous) {
        await invalidate(
          client,
          queryKeys.imports.candidates(spaceId, importId),
          queryKeys.imports.aiPreview(spaceId, importId),
        );
        return;
      }
      const includedDelta =
        Number(!data.excluded && data.errors === null) - Number(!previous.excluded && previous.errors === null);
      const cardDelta = data.isCardSettlement ? includedDelta : 0;
      const month = `${data.bookingDate?.slice(0, 7)}-01`;
      const changedCardPages: Array<readonly unknown[]> = [];
      for (const [key, page] of pages) {
        const params = key.at(-1) as ImportCandidatesQuery;
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
      await invalidate(client, queryKeys.imports.aiPreview(spaceId, importId), ...changedCardPages);
    },
  });

/** Mutation that commits an import. */
export const commitImportMutationOptions = (spaceId: string, id: string) =>
  mutationOptions({
    mutationFn: (data: CommitImportRequest) => commitImport(spaceId, id, data),
    onSuccess: (_data, _variables, _result, { client }) =>
      invalidate(
        client,
        queryKeys.imports.all(spaceId),
        queryKeys.transactions.all(spaceId),
        queryKeys.budgets.all(spaceId),
      ),
  });

/** Mutation that cancels an import. */
export const cancelImportMutationOptions = (spaceId: string, id: string) =>
  mutationOptions({
    mutationFn: () => cancelImport(spaceId, id),
    onSuccess: (_data, _variables, _result, { client }) => invalidate(client, queryKeys.imports.all(spaceId)),
  });

/** Mutation that changes the import settings. */
export const updateImportSettingsMutationOptions = (spaceId: string) =>
  mutationOptions({
    mutationFn: (data: UpdateImportSettingsRequest) => updateImportSettings(spaceId, data),
    onSuccess: (_data, _variables, _result, { client }) => invalidate(client, queryKeys.imports.settings(spaceId)),
  });

/** Mutation that lets the AI propose categories for the rows without one. */
export const categorizeImportMutationOptions = (spaceId: string, id: string) =>
  mutationOptions({
    mutationFn: (data: CategorizeImportRequest) => categorizeImport(spaceId, id, data),
    onSuccess: (_data, _variables, _result, { client }) => invalidate(client, queryKeys.imports.detail(spaceId, id)),
  });
