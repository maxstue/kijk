import { apiClient } from '@kijk/api/client';
import { unwrapApiResponse } from '@kijk/api/http';

import type {
  CategorizeImportRequest,
  CommitImportRequest,
  CreateImportData,
  CsvImportMapping,
  ImportPreviewParams,
  ImportCandidatesQuery,
  UpdateImportCandidateData,
  UpdateImportSettingsRequest,
} from './types';

/** Loads the latest imports of the active space. */
export async function getImports(spaceId: string, signal?: AbortSignal) {
  return unwrapApiResponse(await apiClient().GET('/api/spaces/{spaceId}/imports', { params: { path: { spaceId } }, signal }));
}

/** Loads an import. */
export async function getImport(spaceId: string, id: string, signal?: AbortSignal) {
  return unwrapApiResponse(await apiClient().GET('/api/spaces/{spaceId}/imports/{id}', { params: { path: { spaceId, id } }, signal }));
}

/** Loads the first rows of an uploaded file, optionally with another format. */
export async function getImportPreview(spaceId: string, id: string, query: ImportPreviewParams, signal?: AbortSignal) {
  return unwrapApiResponse(
    await apiClient().GET('/api/spaces/{spaceId}/imports/{id}/preview', { params: { path: { spaceId, id }, query }, signal }),
  );
}

/** Loads the rows of an import waiting for review. */
export async function getImportCandidates(spaceId: string, id: string, query: ImportCandidatesQuery = {}, signal?: AbortSignal) {
  return unwrapApiResponse(
    await apiClient().GET('/api/spaces/{spaceId}/imports/{id}/candidates', { params: { path: { spaceId, id }, query }, signal }),
  );
}

/** Uploads a bank export as multipart form data and starts its import. */
export async function createImport(spaceId: string, data: CreateImportData) {
  const form = new FormData();
  form.append('accountId', data.accountId);
  form.append('file', data.file);
  return unwrapApiResponse(
    await apiClient().POST('/api/spaces/{spaceId}/imports', { params: { path: { spaceId } },
      body: { accountId: data.accountId, file: data.file.name },
      bodySerializer: () => form,
    }),
  );
}

/** Confirms the column mapping and starts reading the file. */
export async function confirmImportMapping(spaceId: string, id: string, mapping: CsvImportMapping) {
  return unwrapApiResponse(
    await apiClient().POST('/api/spaces/{spaceId}/imports/{id}/mapping', { body: mapping, params: { path: { spaceId, id } } }),
  );
}

/** Changes the category or exclusion of a row during the review. */
export async function updateImportCandidate(spaceId: string, data: UpdateImportCandidateData) {
  return unwrapApiResponse(
    await apiClient().PUT('/api/spaces/{spaceId}/imports/{id}/candidates/{candidateId}', {
      body: data.candidate,
      params: { path: { spaceId, candidateId: data.candidateId, id: data.importId } },
    }),
  );
}

/** Replaces the account's transactions in the covered months with the reviewed rows. */
export async function commitImport(spaceId: string, id: string, data: CommitImportRequest) {
  return unwrapApiResponse(
    await apiClient().POST('/api/spaces/{spaceId}/imports/{id}/commit', { body: data, params: { path: { spaceId, id } } }),
  );
}

/** Cancels an open import and deletes its file. */
export async function cancelImport(spaceId: string, id: string) {
  return unwrapApiResponse(await apiClient().POST('/api/spaces/{spaceId}/imports/{id}/cancel', { params: { path: { spaceId, id } } }));
}

/** Loads the import settings of a space. */
export async function getImportSettings(spaceId: string, signal?: AbortSignal) {
  return unwrapApiResponse(await apiClient().GET('/api/spaces/{spaceId}/imports/settings', { params: { path: { spaceId } }, signal }));
}

/** Changes the import settings of a space. */
export async function updateImportSettings(spaceId: string, data: UpdateImportSettingsRequest) {
  return unwrapApiResponse(await apiClient().PUT('/api/spaces/{spaceId}/imports/settings', { params: { path: { spaceId } }, body: data }));
}

/** Starts the AI categorization of the rows without a category. */
export async function categorizeImport(spaceId: string, id: string, data: CategorizeImportRequest) {
  return unwrapApiResponse(
    await apiClient().POST('/api/spaces/{spaceId}/imports/{id}/categorize', { body: data, params: { path: { spaceId, id } } }),
  );
}

/** Loads exactly the texts the AI categorization of an import would send. */
export async function getImportAiPreview(spaceId: string, id: string, signal?: AbortSignal) {
  return unwrapApiResponse(await apiClient().GET('/api/spaces/{spaceId}/imports/{id}/ai-preview', { params: { path: { spaceId, id } }, signal }));
}
