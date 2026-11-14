import { apiClient } from '@kijk/api/client';
import {
  importsAiDataPreview,
  importsCancel,
  importsCandidates,
  importsCommit,
  importsConfirmMapping,
  importsDetails,
  importsFilePreview,
  importsList,
  importsResetOverrides,
  importsSettings,
  importsStart,
  importsStartCategorization,
  importsUpdateCandidate,
  importsUpdateSettings,
} from '@kijk/api/generated/sdk';

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
export async function list(spaceId: string, signal?: AbortSignal) {
  return importsList({ client: apiClient(), path: { spaceId }, signal });
}

/** Loads an import. */
export async function getDetails(spaceId: string, id: string, signal?: AbortSignal) {
  return importsDetails({ client: apiClient(), path: { spaceId, id }, signal });
}

/** Loads the first rows of an uploaded file, optionally with another format. */
export async function getFilePreview(spaceId: string, id: string, query: ImportPreviewParams, signal?: AbortSignal) {
  return importsFilePreview({ client: apiClient(), path: { spaceId, id }, query, signal });
}

/** Loads the rows of an import waiting for review. */
export async function getCandidates(
  spaceId: string,
  id: string,
  query: ImportCandidatesQuery = {},
  signal?: AbortSignal,
) {
  return importsCandidates({ client: apiClient(), path: { spaceId, id }, query, signal });
}

/** Uploads a bank export as multipart form data and starts its import. */
export async function start(spaceId: string, data: CreateImportData) {
  return importsStart({ client: apiClient(), path: { spaceId }, body: { accountId: data.accountId, file: data.file } });
}

/** Confirms the column mapping and starts reading the file. */
export async function confirmMapping(spaceId: string, id: string, mapping: CsvImportMapping) {
  return importsConfirmMapping({ client: apiClient(), body: mapping, path: { spaceId, id } });
}

/** Changes the category or exclusion of a row during the review. */
export async function updateCandidate(spaceId: string, data: UpdateImportCandidateData) {
  return importsUpdateCandidate({
    client: apiClient(),
    body: data.candidate,
    path: { spaceId, candidateId: data.candidateId, id: data.importId },
  });
}

/** Replaces the account's transactions in the covered months with the reviewed rows. */
export async function commit(spaceId: string, id: string, data: CommitImportRequest) {
  return importsCommit({ client: apiClient(), body: data, path: { spaceId, id } });
}

/** Cancels an open import and deletes its file. */
export async function cancel(spaceId: string, id: string) {
  return importsCancel({ client: apiClient(), path: { spaceId, id } });
}

/** Loads the import settings of a space. */
export async function getSettings(spaceId: string, signal?: AbortSignal) {
  return importsSettings({ client: apiClient(), path: { spaceId }, signal });
}

/** Changes the import settings of a space. */
export async function updateSettings(spaceId: string, data: UpdateImportSettingsRequest) {
  return importsUpdateSettings({ client: apiClient(), path: { spaceId }, body: data });
}

/** Starts the AI categorization of the rows without a category. */
export async function startCategorization(spaceId: string, id: string, data: CategorizeImportRequest) {
  return importsStartCategorization({ client: apiClient(), body: data, path: { spaceId, id } });
}

/** Loads exactly the texts the AI categorization of an import would send. */
export async function getAiDataPreview(spaceId: string, id: string, signal?: AbortSignal) {
  return importsAiDataPreview({ client: apiClient(), path: { spaceId, id }, signal });
}

/** Clears every manual category choice in the import, across all pages and months. */
export async function resetOverrides(spaceId: string, id: string) {
  return importsResetOverrides({ client: apiClient(), path: { spaceId, id } });
}
