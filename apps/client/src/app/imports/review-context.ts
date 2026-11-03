import type { ImportCandidatePage, ImportJob } from '@kijk/api/imports/types';
import type { UseQueryResult } from '@tanstack/react-query';
import { createContext } from 'react';

import type { ReviewActionProps } from './review-actions';

export interface ImportReviewState {
  job: ImportJob;
  stage: 'months' | 'review';
  onStageChange: (stage: 'months' | 'review') => void;
  included: Set<string>;
  months: Set<string>;
  isPending: boolean;
  onToggleMonth: (month: string, checked: boolean) => void;
  onCancel: () => void;
  actions: ReviewActionProps;
  reviewQuery: UseQueryResult<ImportCandidatePage>;
  acceptErrors: boolean;
  onAcceptErrors: (accepted: boolean) => void;
  selectedMonths: string;
  onPageChange: (page: number) => void;
  onResetOverrides: () => void;
  showAiPreview: boolean;
  onAiPreviewChange: (open: boolean) => void;
}
export const ImportReviewContext = createContext<ImportReviewState | null>(null);
