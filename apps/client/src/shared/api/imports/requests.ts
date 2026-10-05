import { apiClient } from '@/shared/lib/api-client';
import { unwrapApiResponse } from '@/shared/utils/http';

import type {
  CommitImportRequest,
  CreateImportData,
  CsvImportMapping,
  ImportPreviewParams,
  PurposeRetention,
  UpdateImportCandidateData,
} from './types';

/** Loads the latest imports of the active household. */
export async function getImports(signal?: AbortSignal) {
  return unwrapApiResponse(await apiClient.GET('/api/imports', { signal }));
}

/** Loads an import. */
export async function getImport(id: string, signal?: AbortSignal) {
  return unwrapApiResponse(await apiClient.GET('/api/imports/{id}', { params: { path: { id } }, signal }));
}

/** Loads the first rows of an uploaded file, optionally with another format. */
export async function getImportPreview(id: string, query: ImportPreviewParams, signal?: AbortSignal) {
  return unwrapApiResponse(
    await apiClient.GET('/api/imports/{id}/preview', { params: { path: { id }, query }, signal }),
  );
}

/** Loads the rows of an import waiting for review. */
export async function getImportCandidates(id: string, signal?: AbortSignal) {
  return unwrapApiResponse(await apiClient.GET('/api/imports/{id}/candidates', { params: { path: { id } }, signal }));
}

/** Uploads a bank export as multipart form data and starts its import. */
export async function createImport(data: CreateImportData) {
  const form = new FormData();
  form.append('accountId', data.accountId);
  form.append('file', data.file);
  return unwrapApiResponse(
    await apiClient.POST('/api/imports', {
      body: { accountId: data.accountId, file: data.file.name },
      bodySerializer: () => form,
    }),
  );
}

/** Confirms the column mapping and starts reading the file. */
export async function confirmImportMapping(id: string, mapping: CsvImportMapping) {
  return unwrapApiResponse(
    await apiClient.POST('/api/imports/{id}/mapping', { body: mapping, params: { path: { id } } }),
  );
}

/** Changes the category or exclusion of a row during the review. */
export async function updateImportCandidate(data: UpdateImportCandidateData) {
  return unwrapApiResponse(
    await apiClient.PUT('/api/imports/{id}/candidates/{candidateId}', {
      body: data.candidate,
      params: { path: { candidateId: data.candidateId, id: data.importId } },
    }),
  );
}

/** Replaces the account's transactions in the covered months with the reviewed rows. */
export async function commitImport(id: string, data: CommitImportRequest) {
  return unwrapApiResponse(await apiClient.POST('/api/imports/{id}/commit', { body: data, params: { path: { id } } }));
}

/** Cancels an open import and deletes its file. */
export async function cancelImport(id: string) {
  return unwrapApiResponse(await apiClient.POST('/api/imports/{id}/cancel', { params: { path: { id } } }));
}

/** Loads the import settings of the active household. */
export async function getImportSettings(signal?: AbortSignal) {
  return unwrapApiResponse(await apiClient.GET('/api/imports/settings', { signal }));
}

/** Changes how much of the purpose text imported transactions keep. */
export async function updateImportSettings(purposeRetention: PurposeRetention) {
  return unwrapApiResponse(await apiClient.PUT('/api/imports/settings', { body: { purposeRetention } }));
}
