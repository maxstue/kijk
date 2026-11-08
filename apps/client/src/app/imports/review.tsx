import * as importsOptions from '@kijk/api/imports/options';
import type { ImportJob } from '@kijk/api/imports/types';
import { keepPreviousData, useMutation, useQuery } from '@tanstack/react-query';
import { useState, type ReactNode } from 'react';
import { toast } from 'sonner';

import { formatImportMonth } from '@/app/imports/helpers';
import { useImportPending } from '@/app/imports/use-import-pending';
import { useSpaceId } from '@/shared/hooks/use-active-space';

import type { ReviewActionProps } from './review-actions';
import { ImportReviewContext, type ImportReviewState } from './review-context';
interface ImportReviewProps {
  job: ImportJob;
  stage: 'months' | 'review';
  onStageChange: (stage: 'months' | 'review') => void;
  children: ReactNode;
}

/** Owns state shared across review steps and both action bars, including while adjustments are unmounted. */
export function ImportReview({ job, stage, onStageChange, children }: ImportReviewProps) {
  const spaceId = useSpaceId();
  const [includedEdgeMonths, setIncludedEdgeMonths] = useState<string[]>([]);
  const [page, setPage] = useState(1);
  const [acceptErrors, setAcceptErrors] = useState(false);
  const [showAiPreview, setShowAiPreview] = useState(false);
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
  const isPending = useImportPending(job);
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

  const value: ImportReviewState = {
    job,
    stage,
    onStageChange,
    included,
    months,
    isPending,
    onToggleMonth: toggleEdgeMonth,
    onCancel: () => cancelMutation.mutate(),
    actions: actionProps,
    reviewQuery,
    acceptErrors,
    onAcceptErrors: setAcceptErrors,
    selectedMonths,
    onPageChange: setPage,
    onResetOverrides: () =>
      resetMutation.mutate(undefined, {
        onSuccess: (count) => toast.success(`${count} manual overrides reset`),
        onError: (error) => toast.error(error.name, { description: error.message }),
      }),
    showAiPreview,
    onAiPreviewChange: setShowAiPreview,
  };
  return <ImportReviewContext value={value}>{children}</ImportReviewContext>;
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

export {
  ImportReviewActions,
  ImportReviewAiDialog,
  ImportReviewContent,
  ImportReviewMonthSelection,
  ImportReviewStatus,
} from './review-parts';
export { ImportReviewTransactions } from './review-transactions';
