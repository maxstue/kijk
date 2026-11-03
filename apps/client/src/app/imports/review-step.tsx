import type { ImportJob } from '@kijk/api/imports/types';

import {
  ImportReview,
  ImportReviewMonthSelection,
  ImportReviewContent,
  ImportReviewActions,
  ImportReviewStatus,
  ImportReviewTransactions,
  ImportReviewAiDialog,
} from './review';
import { ReviewAdjustments } from './review-adjustments';

interface ImportReviewStepProps {
  job: ImportJob;
  stage: 'months' | 'review';
  onStageChange: (stage: 'months' | 'review') => void;
}

/** Composes the review workflow; shared state lives in Root and survives step changes. */
export function ImportReviewStep(props: ImportReviewStepProps) {
  return (
    <ImportReview {...props}>
      <ImportReviewMonthSelection />
      <ImportReviewContent>
        <ImportReviewActions>
          <ImportReviewStatus />
          <ReviewAdjustments>
            <ImportReviewTransactions />
          </ReviewAdjustments>
        </ImportReviewActions>
        <ImportReviewAiDialog />
      </ImportReviewContent>
    </ImportReview>
  );
}
