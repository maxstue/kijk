import type { components } from '@/shared/api/generated/kijk';

/** The state of an import. */
export type ImportJob = components['schemas']['ImportJobResponse'];
/** The processing state of an import. */
export type ImportJobStatus = components['schemas']['ImportJobStatus'];
/** How the columns of a bank export map to transaction fields. */
export type CsvImportMapping = components['schemas']['CsvImportMapping'];
/** The first rows of an uploaded file. */
export type ImportPreview = components['schemas']['ImportPreviewResponse'];
/** A row of an import waiting for review. */
export type ImportCandidate = components['schemas']['ImportCandidateResponse'];
/** The import settings of the active household. */
export type ImportSettings = components['schemas']['ImportSettingsResponse'];
/** How much of the purpose text imported transactions keep. */
export type PurposeRetention = components['schemas']['PurposeRetention'];
/** Payload for committing an import. */
export type CommitImportRequest = components['schemas']['CommitImportRequest'];
/** Payload for changing a row during the review. */
export type UpdateImportCandidateRequest = components['schemas']['UpdateImportCandidateRequest'];

/** Format overrides for the mapping preview. */
export interface ImportPreviewParams {
  delimiter?: string;
  encoding?: string;
  headerRowIndex?: number;
}

/** Variables of the upload mutation. */
export interface CreateImportData {
  accountId: string;
  file: File;
}

/** Variables of the update-row mutation. */
export interface UpdateImportCandidateData {
  importId: string;
  candidateId: string;
  candidate: UpdateImportCandidateRequest;
}
