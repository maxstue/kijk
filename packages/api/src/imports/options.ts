import { invalidate } from '@kijk/api/cache';
import { queryKeys } from '@kijk/api/query-keys';
import { mutationOptions, queryOptions } from '@tanstack/react-query';

import {
  cancel,
  startCategorization,
  commit,
  confirmMapping,
  start,
  getDetails,
  getAiDataPreview,
  getCandidates,
  getFilePreview,
  getSettings,
  list,
  updateCandidate,
  updateSettings,
} from './requests';
import type {
  CategorizeImportRequest,
  CommitImportRequest,
  CreateImportData,
  CsvImportMapping,
  ImportJobStatus,
  ImportCandidatesQuery,
  ImportPreviewParams,
  UpdateImportCandidateData,
  UpdateImportSettingsRequest,
} from './types';

const processingStatuses = new Set<ImportJobStatus>(['Pending', 'Analyzing', 'Reading', 'Categorizing']);
const pollIntervalMs = 1500;

/** Returns whether the import is processed in the background, so its state should be polled. */
export const isProcessing = (status: ImportJobStatus | undefined) =>
  status !== undefined && processingStatuses.has(status);

/** Query for the latest imports of the active space. */
export const listQueryOptions = (spaceId: string) =>
  queryOptions({
    queryFn: ({ signal }) => list(spaceId, signal),
    queryKey: queryKeys.imports.list(spaceId),
  });

/** Query for an import; polls while the background job works on it. */
export const detailsQueryOptions = (spaceId: string, id: string) =>
  queryOptions({
    queryFn: ({ signal }) => getDetails(spaceId, id, signal),
    queryKey: queryKeys.imports.detail(spaceId, id),
    refetchInterval: (query) => (isProcessing(query.state.data?.status) ? pollIntervalMs : false),
  });

/** Query for the first rows of an uploaded file. */
export const filePreviewQueryOptions = (spaceId: string, id: string, params: ImportPreviewParams) =>
  queryOptions({
    queryFn: ({ signal }) => getFilePreview(spaceId, id, params, signal),
    queryKey: queryKeys.imports.preview(spaceId, id, params),
  });

/** Query for one page of review rows and totals for the complete selected period. */
export const candidatesQueryOptions = (spaceId: string, id: string, params: ImportCandidatesQuery = {}) => {
  const query = {
    ...params,
    page: params.page ?? 1,
    pageSize: params.pageSize ?? 100,
    cardSettlementsOnly: params.cardSettlementsOnly ?? false,
  };
  return queryOptions({
    queryFn: ({ signal }) => getCandidates(spaceId, id, query, signal),
    queryKey: queryKeys.imports.candidatesPage(spaceId, id, query),
  });
};

/** Query for the texts the AI categorization of an import would send. */
export const aiDataPreviewQueryOptions = (spaceId: string, id: string) =>
  queryOptions({
    queryFn: ({ signal }) => getAiDataPreview(spaceId, id, signal),
    queryKey: queryKeys.imports.aiPreview(spaceId, id),
  });

/** Query for the import settings of a space. */
export const settingsQueryOptions = (spaceId: string) =>
  queryOptions({
    queryFn: ({ signal }) => getSettings(spaceId, signal),
    queryKey: queryKeys.imports.settings(spaceId),
  });

/** Mutation that uploads a bank export. */
export const startMutationOptions = (spaceId: string) =>
  mutationOptions({
    mutationFn: (data: CreateImportData) => start(spaceId, data),
    onSuccess: (_data, _variables, _result, { client }) => invalidate(client, queryKeys.imports.list(spaceId)),
  });

/** Mutation that confirms a column mapping. */
export const confirmMappingMutationOptions = (spaceId: string, id: string) =>
  mutationOptions({
    mutationFn: (mapping: CsvImportMapping) => confirmMapping(spaceId, id, mapping),
    onSuccess: (_data, _variables, _result, { client }) => invalidate(client, queryKeys.imports.detail(spaceId, id)),
  });

/** Mutation that changes a row during the review. */
export const updateCandidateMutationOptions = (spaceId: string) =>
  mutationOptions({
    mutationFn: (data: UpdateImportCandidateData) => updateCandidate(spaceId, data),
    onSuccess: (_data, { importId }, _result, { client }) =>
      invalidate(
        client,
        queryKeys.imports.candidates(spaceId, importId),
        queryKeys.imports.aiPreview(spaceId, importId),
      ),
  });

/** Mutation that commits an import. */
export const commitMutationOptions = (spaceId: string, id: string) =>
  mutationOptions({
    mutationFn: (data: CommitImportRequest) => commit(spaceId, id, data),
    onSuccess: (_data, _variables, _result, { client }) =>
      invalidate(
        client,
        queryKeys.imports.all(spaceId),
        queryKeys.transactions.all(spaceId),
        queryKeys.budgets.all(spaceId),
      ),
  });

/** Mutation that cancels an import. */
export const cancelMutationOptions = (spaceId: string, id: string) =>
  mutationOptions({
    mutationFn: () => cancel(spaceId, id),
    onSuccess: (_data, _variables, _result, { client }) => invalidate(client, queryKeys.imports.all(spaceId)),
  });

/** Mutation that changes the import settings. */
export const updateSettingsMutationOptions = (spaceId: string) =>
  mutationOptions({
    mutationFn: (data: UpdateImportSettingsRequest) => updateSettings(spaceId, data),
    onSuccess: (_data, _variables, _result, { client }) => invalidate(client, queryKeys.imports.settings(spaceId)),
  });

/** Mutation that lets the AI propose categories for the rows without one. */
export const startCategorizationMutationOptions = (spaceId: string, id: string) =>
  mutationOptions({
    mutationFn: (data: CategorizeImportRequest) => startCategorization(spaceId, id, data),
    onSuccess: (_data, _variables, _result, { client }) => invalidate(client, queryKeys.imports.detail(spaceId, id)),
  });
