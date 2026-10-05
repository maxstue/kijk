import { mutationOptions, queryOptions } from '@tanstack/react-query';

import { queryKeys } from '@/shared/api/query-keys';

import {
  cancelImport,
  commitImport,
  confirmImportMapping,
  createImport,
  getImport,
  getImportCandidates,
  getImportPreview,
  getImportSettings,
  getImports,
  updateImportCandidate,
  updateImportSettings,
} from './requests';
import type {
  CommitImportRequest,
  CreateImportData,
  CsvImportMapping,
  ImportJobStatus,
  ImportPreviewParams,
  PurposeRetention,
  UpdateImportCandidateData,
} from './types';

const processingStatuses: ImportJobStatus[] = ['Pending', 'Analyzing', 'Reading'];
const pollIntervalMs = 1500;

/** Returns whether the import is processed in the background, so its state should be polled. */
export const isImportProcessing = (status: ImportJobStatus | undefined) =>
  status !== undefined && processingStatuses.includes(status);

/** Query for the latest imports of the active household. */
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

/** Query for the rows of an import waiting for review. */
export const importCandidatesQueryOptions = (id: string) =>
  queryOptions({
    queryFn: ({ signal }) => getImportCandidates(id, signal),
    queryKey: queryKeys.imports.candidates(id),
  });

/** Query for the import settings of the active household. */
export const importSettingsQueryOptions = () =>
  queryOptions({
    queryFn: ({ signal }) => getImportSettings(signal),
    queryKey: queryKeys.imports.settings(),
  });

/** Mutation that uploads a bank export. */
export const createImportMutationOptions = () =>
  mutationOptions({ mutationFn: (data: CreateImportData) => createImport(data) });

/** Mutation that confirms a column mapping. */
export const confirmImportMappingMutationOptions = (id: string) =>
  mutationOptions({ mutationFn: (mapping: CsvImportMapping) => confirmImportMapping(id, mapping) });

/** Mutation that changes a row during the review. */
export const updateImportCandidateMutationOptions = () =>
  mutationOptions({ mutationFn: (data: UpdateImportCandidateData) => updateImportCandidate(data) });

/** Mutation that commits an import. */
export const commitImportMutationOptions = (id: string) =>
  mutationOptions({ mutationFn: (data: CommitImportRequest) => commitImport(id, data) });

/** Mutation that cancels an import. */
export const cancelImportMutationOptions = (id: string) => mutationOptions({ mutationFn: () => cancelImport(id) });

/** Mutation that changes the import settings. */
export const updateImportSettingsMutationOptions = () =>
  mutationOptions({ mutationFn: (purposeRetention: PurposeRetention) => updateImportSettings(purposeRetention) });
