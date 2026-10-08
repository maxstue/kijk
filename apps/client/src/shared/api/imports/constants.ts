import type { AiDataSharing, PurposeRetention } from './types';

/** Labels of the purpose retention settings. */
export const purposeRetentionLabels: Record<PurposeRetention, string> = {
  Keep: 'Keep the cleaned purpose',
  Remove: 'Do not store the purpose',
  Truncate: 'Keep only the first 40 characters',
};

/** Labels of the AI data-sharing levels. */
export const aiDataSharingLabels: Record<AiDataSharing, string> = {
  Off: 'Off – only on request for a single import',
  Strict: 'Strict – offer cleaned counterparty and purpose, no names',
};
