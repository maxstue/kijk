import { use, useState, type ReactNode } from 'react';

import { AiPreviewDialog } from './ai-preview-dialog';
import { MonthSelection } from './month-selection';
import { ReviewActions } from './review-actions';
import { ImportReviewContext } from './review-context';
import { ReviewLoadingState, UnreadableRows } from './review-status';

interface ReviewSlotProps {
  children: ReactNode;
}

export function ImportReviewMonthSelection() {
  const context = use(ImportReviewContext);
  if (!context) {
    throw new Error('ImportReviewMonthSelection requires ImportReview');
  }
  const { job, stage, included, months, isPending, onToggleMonth, onCancel, onStageChange } = context;
  if (stage !== 'months') {
    return null;
  }
  return (
    <MonthSelection
      job={job}
      included={included}
      months={months}
      isPending={isPending}
      onToggle={onToggleMonth}
      onCancel={onCancel}
      onContinue={() => onStageChange('review')}
    />
  );
}

export function ImportReviewContent({ children }: ReviewSlotProps) {
  const context = use(ImportReviewContext);
  if (!context) {
    throw new Error('ImportReviewContent requires ImportReview');
  }
  return context.stage === 'review' ? <div className='flex flex-col gap-4'>{children}</div> : null;
}

/** Keeps scroll visibility local while both bars use the same commit action and pending state. */
export function ImportReviewActions({ children }: ReviewSlotProps) {
  const context = use(ImportReviewContext);
  const [floating, setFloating] = useState(false);
  if (!context) {
    throw new Error('ImportReviewActions requires ImportReview');
  }
  return (
    <>
      <ReviewActions {...context.actions} onVisibilityChange={setFloating} />
      {children}
      {floating && <ReviewActions {...context.actions} floating />}
    </>
  );
}

export function ImportReviewStatus() {
  const context = use(ImportReviewContext);
  if (!context) {
    throw new Error('ImportReviewStatus requires ImportReview');
  }
  const { job, reviewQuery, acceptErrors, onAcceptErrors } = context;
  return (
    <>
      <UnreadableRows
        review={reviewQuery.data}
        requiresConfirmation={job.hasHighErrorRate}
        accepted={acceptErrors}
        onAccept={onAcceptErrors}
      />
      <ReviewLoadingState
        isError={reviewQuery.isError}
        isLoading={!reviewQuery.data}
        onRetry={() => void reviewQuery.refetch()}
      />
    </>
  );
}

export function ImportReviewAiDialog() {
  const context = use(ImportReviewContext);
  if (!context) {
    throw new Error('ImportReviewAiDialog requires ImportReview');
  }
  return <AiPreviewDialog job={context.job} open={context.showAiPreview} onOpenChange={context.onAiPreviewChange} />;
}
