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
/** Which transaction data the AI categorization may see. */
export type AiDataSharing = components['schemas']['AiDataSharing'];
/** Payload for changing the import settings. */
export type UpdateImportSettingsRequest = components['schemas']['UpdateImportSettingsRequest'];
/** Payload for categorizing an import with the AI. */
export type CategorizeImportRequest = components['schemas']['CategorizeImportRequest'];
/** What the AI categorization of an import would send. */
export type AiPreview = components['schemas']['AiPreviewResponse'];
/** A distinct text the AI categorization would send. */
export type AiPreviewItem = components['schemas']['AiPreviewItemResponse'];
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

/** Variables of the AI preview mutation. */
export interface UpdateAiPreviewItemData {
  key: string;
  excluded: boolean;
}
