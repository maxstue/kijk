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
import type { ReviewQuery } from './types';

interface Props {
  job: ImportJob;
  query: ReviewQuery;
  onQueryChange: (query: ReviewQuery) => void;
  stage: 'months' | 'review';
  onStageChange: (stage: 'months' | 'review') => void;
}

/** Composes the review workflow; shared state lives in Root and survives step changes. */
export function ImportReviewStep(props: Props) {
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
