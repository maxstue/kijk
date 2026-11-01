import * as importsOptions from '@kijk/api/imports/options';
import type { ImportJob } from '@kijk/api/imports/types';
import { Button } from '@kijk/ui/components/button';
import { CardContent } from '@kijk/ui/components/card';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@kijk/ui/components/dialog';
import { keepPreviousData, useMutation, useQuery } from '@tanstack/react-query';
import { X } from 'lucide-react';
import { useState } from 'react';
import { toast } from 'sonner';

import { ImportAiCategorization } from '@/app/imports/ai-preview';
import { ImportCandidateTable } from '@/app/imports/candidate-table';
import { formatImportMonth } from '@/app/imports/helpers';
import { useSpaceId } from '@/shared/hooks/use-active-space';
import { useFeature } from '@/shared/hooks/use-feature';

import { CardSettlements } from './card-settlements';
import { MonthSelection } from './month-selection';
import type { ReviewActionProps } from './review-actions';
import { ReviewActions } from './review-actions';
import { AiSuggestionsAction, CategorizationProgress, ReviewAdjustments } from './review-adjustments';
import { ReviewLoadingState, UnreadableRows } from './review-status';

interface ImportReviewStepProps {
  job: ImportJob;
  stage: 'months' | 'review';
  onStageChange: (stage: 'months' | 'review') => void;
}

/** Step that shows what the import will change and commits it. */
export function ImportReviewStep({ job, stage, onStageChange }: ImportReviewStepProps) {
  const spaceId = useSpaceId();
  const [includedEdgeMonths, setIncludedEdgeMonths] = useState<string[]>([]);
  const [page, setPage] = useState(1);
  const [acceptErrors, setAcceptErrors] = useState(false);
  const [showAiPreview, setShowAiPreview] = useState(false);
  const [showFloatingActions, setShowFloatingActions] = useState(false);
  const aiImport = useFeature('aiImport');
  const commitMutation = useMutation(importsOptions.commitMutationOptions(spaceId, job.id));
  const resetMutation = useMutation(importsOptions.resetOverridesMutationOptions(spaceId, job.id));
  const cancelMutation = useMutation(importsOptions.cancelMutationOptions(spaceId, job.id));

  const included = new Set(includedEdgeMonths);
  const months = new Set([...job.fullMonths, ...includedEdgeMonths]);
  const selectedMonths = [...months].sort((left, right) => left.localeCompare(right)).join(',');
  const reviewQuery = useQuery({
    ...importsOptions.candidatesQueryOptions(spaceId, job.id, { months: selectedMonths, page }),
    enabled: stage === 'review',
    placeholderData: keepPreviousData,
  });
  const review = reviewQuery.data;
  const importedCount = review?.includedCount ?? 0;
  const isPending =
    commitMutation.isPending || cancelMutation.isPending || resetMutation.isPending || job.status === 'Categorizing';
  const isReviewLoading = !review || reviewQuery.isFetching || reviewQuery.isError;
  const cannotCommit = (job.hasHighErrorRate && !acceptErrors) || months.size === 0;

  function toggleEdgeMonth(month: string, checked: boolean) {
    setPage(1);
    setIncludedEdgeMonths((previous) => (checked ? [...previous, month] : previous.filter((item) => item !== month)));
  }

  function onCommit() {
    commitMutation.mutate(
      { acceptErrors, includedEdgeMonths },
      {
        onError: (error) => toast.error(error.name, { description: error.message }),
        onSuccess: (result) => toast.success(`${result.importedCount} transactions imported`),
      },
    );
  }

  const actionProps: ReviewActionProps = {
    accountName: job.accountName,
    months: [...months]
      .sort((left, right) => left.localeCompare(right))
      .map(formatImportMonth)
      .join(', '),
    importedCount: Number(importedCount),
    hint: getReviewHint(job, acceptErrors),
    isPending,
    isSaving: commitMutation.isPending,
    cannotSave: isPending || cannotCommit || isReviewLoading,
    onBack: () => onStageChange('months'),
    onCommit,
  };

  if (stage === 'months') {
    return (
      <MonthSelection
        job={job}
        included={included}
        months={months}
        isPending={isPending}
        onToggle={toggleEdgeMonth}
        onCancel={() => cancelMutation.mutate()}
        onContinue={() => onStageChange('review')}
      />
    );
  }

  return (
    <div className='flex flex-col gap-4'>
      <ReviewActions {...actionProps} onVisibilityChange={setShowFloatingActions} />
      <UnreadableRows
        review={review}
        requiresConfirmation={job.hasHighErrorRate}
        accepted={acceptErrors}
        onAccept={setAcceptErrors}
      />
      <ReviewLoadingState
        isError={reviewQuery.isError}
        isLoading={!review}
        onRetry={() => void reviewQuery.refetch()}
      />
      <ReviewAdjustments>
        <CardContent className='flex flex-col gap-4 px-0'>
          <div className='flex flex-col gap-4 px-(--card-spacing)'>
            <div className='flex flex-wrap items-center gap-3'>
              <h3 className='flex-1 font-medium'>Transactions to import</h3>
              <AiSuggestionsAction enabled={aiImport} disabled={isPending} onOpen={() => setShowAiPreview(true)} />
              <Button
                variant='ghost'
                size='sm'
                disabled={isPending}
                title='Clears every manual category in this import to Uncategorized. Automatic categories and import selections are kept.'
                onClick={() =>
                  resetMutation.mutate(undefined, {
                    onSuccess: (count) => toast.success(`${count} manual overrides reset`),
                    onError: (error) => toast.error(error.name, { description: error.message }),
                  })
                }
              >
                Reset overrides <X data-icon='inline-end' />
              </Button>
            </div>
            <p className='text-muted-foreground text-sm'>
              Choose a category to override it, or untick a transaction to leave it out. AI suggestions keep your manual
              choices.
            </p>
          </div>
          <div className='relative' aria-busy={job.status === 'Categorizing'}>
            {review && (
              <div inert={isPending || reviewQuery.isPlaceholderData} aria-busy={reviewQuery.isFetching}>
                <CardSettlements count={Number(review.cardSettlementCount)} months={selectedMonths} importId={job.id} />
                <ImportCandidateTable
                  data={review}
                  importId={job.id}
                  isFetching={reviewQuery.isFetching}
                  manualOverrides
                  onPageChange={setPage}
                />
              </div>
            )}
            <CategorizationProgress active={job.status === 'Categorizing'} />
          </div>
        </CardContent>
      </ReviewAdjustments>
      {showFloatingActions && <ReviewActions {...actionProps} floating />}
      <Dialog open={showAiPreview} onOpenChange={setShowAiPreview}>
        <DialogContent className='sm:max-w-3xl'>
          <DialogHeader>
            <DialogTitle>Suggest categories automatically</DialogTitle>
            <DialogDescription>
              Choose which uncategorized transactions the AI may process. Your category choices stay unchanged and are
              not sent as examples. Review the suggestions in the transaction list afterwards.
            </DialogDescription>
          </DialogHeader>
          <ImportAiCategorization job={job} onStarted={() => setShowAiPreview(false)} />
        </DialogContent>
      </Dialog>
    </div>
  );
}

function getReviewHint(job: ImportJob, acceptErrors: boolean) {
  if (job.status === 'Categorizing') {
    return 'Suggesting categories. Your selection is kept while you wait.';
  }
  if (job.hasHighErrorRate && !acceptErrors) {
    return 'Confirm below that you want to skip the unreadable rows.';
  }
  if (job.aiCategorizationUnavailable) {
    return 'Some categories could not be suggested. Choose them or try again.';
  }
  if (Number(job.aiCategorizedCount) > 0) {
    return `${Number(job.aiCategorizedCount)} category suggestions ready. Check the Category column.`;
  }
  return 'Check the transactions below, then save to finish.';
}
