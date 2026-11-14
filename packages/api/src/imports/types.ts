import type * as Api from '@kijk/api/generated/types';

/** The state of an import. */
export type ImportJob = Api.ImportJobResponse;
/** The processing state of an import. */
export type ImportJobStatus = Api.ImportJobStatus;
/** How the columns of a bank export map to transaction fields. */
export type CsvImportMapping = Api.CsvImportMapping;
/** The first rows of an uploaded file. */
export type ImportPreview = Api.ImportPreviewResponse;
/** A row of an import waiting for review. */
export type ImportCandidate = Api.ImportCandidateResponse;
/** A bounded page of review rows and selection-wide totals. */
export type ImportCandidatePage = Api.ImportCandidatePageResponse;

/** Server-side review filters and pagination. */
export interface ImportCandidatesQuery {
  page?: number;
  pageSize?: number;
  months?: string;
  cardSettlementsOnly?: boolean;
}

/** The import settings of the active space. */
export type ImportSettings = Api.ImportSettingsResponse;
/** How much of the purpose text imported transactions keep. */
export type PurposeRetention = Api.PurposeRetention;
/** Which transaction data the AI categorization may see. */
export type AiDataSharing = Api.AiDataSharing;
/** Payload for changing the import settings. */
export type UpdateImportSettingsRequest = Api.UpdateImportSettingsRequest;
/** Payload for categorizing an import with the AI. */
export type CategorizeImportRequest = Api.CategorizeImportRequest;
/** What the AI categorization of an import would send. */
export type AiPreview = Api.AiPreviewResponse;
/** A distinct text the AI categorization would send. */
export type AiPreviewItem = Api.AiPreviewItemResponse;
/** Payload for committing an import. */
export type CommitImportRequest = Api.CommitImportRequest;
/** Payload for changing a row during the review. */
export type UpdateImportCandidateRequest = Api.UpdateImportCandidateRequest;

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
