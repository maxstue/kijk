import {
  cancelImportMutationOptions,
  commitImportMutationOptions,
  importCandidatesQueryOptions,
  updateImportCandidateMutationOptions,
} from '@kijk/api/imports/options';
import type { ImportCandidate, ImportCandidatePage, ImportJob } from '@kijk/api/imports/types';
import { queryKeys } from '@kijk/api/query-keys';
import { Alert, AlertDescription, AlertTitle } from '@kijk/ui/components/alert';
import { Button } from '@kijk/ui/components/button';
import { Checkbox } from '@kijk/ui/components/checkbox';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@kijk/ui/components/dialog';
import { SpinnerIcon } from '@kijk/ui/components/icons';
import { Label } from '@kijk/ui/components/label';
import { keepPreviousData, useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { cn } from 'cn';
import { CreditCard, Sparkles, TriangleAlert } from 'lucide-react';
import { useEffect, useId, useRef, useState } from 'react';
import { toast } from 'sonner';

import { ImportAiCategorization } from '@/app/imports/ai-preview';
import { ImportCandidatePagination, ImportCandidateTable } from '@/app/imports/candidate-table';
import { formatImportMonth } from '@/app/imports/helpers';
import { useSpaceId } from '@/shared/hooks/use-active-space';
import { formatStringToCurrency } from '@/shared/utils/format';

/** Step that shows what the import will change and commits it. */
export function ImportReviewStep({
  job,
  stage,
  onStageChange,
}: {
  job: ImportJob;
  stage: 'months' | 'review';
  onStageChange: (stage: 'months' | 'review') => void;
}) {
  const spaceId = useSpaceId();
  const queryClient = useQueryClient();
  const previousStatus = useRef(job.status);
  useEffect(() => {
    if (previousStatus.current === 'Categorizing' && job.status === 'NeedsReview') {
      void queryClient.invalidateQueries({ queryKey: queryKeys.imports.candidates(spaceId, job.id) });
      void queryClient.invalidateQueries({ queryKey: queryKeys.imports.aiPreview(spaceId, job.id) });
    }
    previousStatus.current = job.status;
  }, [job.id, job.status, queryClient, spaceId]);

  const [includedEdgeMonths, setIncludedEdgeMonths] = useState<string[]>([]);
  const [page, setPage] = useState(1);
  const [acceptErrors, setAcceptErrors] = useState(false);
  const [showAiPreview, setShowAiPreview] = useState(false);
  const commitMutation = useMutation(commitImportMutationOptions(spaceId, job.id));
  const cancelMutation = useMutation(cancelImportMutationOptions(spaceId, job.id));

  const included = new Set(includedEdgeMonths);
  const months = new Set([...job.fullMonths, ...includedEdgeMonths]);
  const selectedMonths = [...months].sort().join(',');
  const reviewQuery = useQuery({
    ...importCandidatesQueryOptions(spaceId, job.id, { months: selectedMonths, page }),
    enabled: stage === 'review',
    placeholderData: keepPreviousData,
  });
  const review = reviewQuery.data;
  const importedCount = review?.includedCount ?? 0;
  const isPending = commitMutation.isPending || cancelMutation.isPending || job.status === 'Categorizing';
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
    <div className='space-y-4'>
      <ReviewActions
        importedCount={Number(importedCount)}
        hint={getReviewHint(job, acceptErrors)}
        isPending={isPending}
        isSaving={commitMutation.isPending}
        cannotSave={isPending || cannotCommit || isReviewLoading}
        onBack={() => onStageChange('months')}
        onCommit={onCommit}
      />
      <section className='rounded-lg border' aria-label='Transactions to import'>
        <div className='flex flex-wrap items-center justify-between gap-3 p-4'>
          <div className='space-y-1'>
            <h3 className='text-sm font-medium'>{[...months].sort().map(formatImportMonth).join(', ')}</h3>
            <p className='text-muted-foreground text-xs'>
              Untick a transaction to leave it out. Choose a category if needed.
            </p>
          </div>
          <Button size='sm' variant='outline' disabled={isPending} onClick={() => setShowAiPreview(true)}>
            <Sparkles className='size-4' /> Suggest categories
          </Button>
        </div>
        <UnreadableRows
          review={review}
          requiresConfirmation={job.hasHighErrorRate}
          accepted={acceptErrors}
          onAccept={setAcceptErrors}
        />
        <div className='relative' aria-busy={job.status === 'Categorizing'}>
          <ReviewLoadingState
            isError={reviewQuery.isError}
            isLoading={!review}
            onRetry={() => void reviewQuery.refetch()}
          />
          {review && (
            <div
              inert={job.status === 'Categorizing' || reviewQuery.isPlaceholderData}
              aria-busy={reviewQuery.isFetching}
            >
              <CardSettlements count={Number(review.cardSettlementCount)} months={selectedMonths} importId={job.id} />
              <ImportCandidateTable
                data={review}
                importId={job.id}
                isFetching={reviewQuery.isFetching}
                onPageChange={setPage}
              />
            </div>
          )}
          {job.status === 'Categorizing' && (
            <div
              role='status'
              aria-label='Suggesting categories'
              className='bg-background/80 absolute inset-0 z-10 backdrop-blur-[1px]'
            >
              <div className='bg-popover sticky top-40 mx-auto flex w-fit max-w-[calc(100%-2rem)] flex-col items-center gap-2 rounded-lg border p-5 text-center shadow-sm'>
                <SpinnerIcon className='size-6 animate-spin' />
                <p className='text-sm font-medium'>Suggesting categories…</p>
                <p className='text-muted-foreground text-xs'>
                  Please wait. Your transactions will update automatically.
                </p>
              </div>
            </div>
          )}
        </div>
      </section>
      <Dialog open={showAiPreview} onOpenChange={setShowAiPreview}>
        <DialogContent className='sm:max-w-3xl'>
          <DialogHeader>
            <DialogTitle>Suggest categories automatically</DialogTitle>
            <DialogDescription>
              Check the shared texts, then start. The suggestions will appear in your transaction list for you to
              review.
            </DialogDescription>
          </DialogHeader>
          <ImportAiCategorization job={job} onStarted={() => setShowAiPreview(false)} />
        </DialogContent>
      </Dialog>
    </div>
  );
}

function ReviewActions({
  importedCount,
  hint,
  isPending,
  isSaving,
  cannotSave,
  onBack,
  onCommit,
}: {
  importedCount: number;
  hint: string;
  isPending: boolean;
  isSaving: boolean;
  cannotSave: boolean;
  onBack: () => void;
  onCommit: () => void;
}) {
  return (
    <div aria-label='Import actions' className='bg-background @container sticky top-12 z-20 border-b py-3 shadow-sm'>
      <div className='grid items-center gap-3 @lg:grid-cols-[minmax(0,1fr)_auto]'>
        <div className='min-w-0 space-y-1' aria-live='polite'>
          <p className='text-sm font-medium'>
            <span className='inline-block min-w-[4ch] tabular-nums'>{importedCount}</span> transactions ready to import
          </p>
          <p className='text-muted-foreground min-h-8 text-xs leading-4'>{hint}</p>
        </div>
        <div className='flex gap-2'>
          <Button disabled={isPending} variant='outline' onClick={onBack}>
            Back
          </Button>
          <Button className='flex-1 @lg:flex-none' disabled={cannotSave} onClick={onCommit}>
            {isSaving && <SpinnerIcon className='size-5 animate-spin' />}
            {isSaving ? 'Saving import…' : 'Save import'}
          </Button>
        </div>
      </div>
    </div>
  );
}

function UnreadableRows({
  review,
  requiresConfirmation,
  accepted,
  onAccept,
}: {
  review: ImportCandidatePage | undefined;
  requiresConfirmation: boolean;
  accepted: boolean;
  onAccept: (accepted: boolean) => void;
}) {
  const id = useId();
  if (!review || Number(review.errorCount) === 0) {
    return null;
  }
  return (
    <Alert className='mx-4 mb-4 w-auto' variant={requiresConfirmation ? 'destructive' : 'default'}>
      <TriangleAlert />
      <AlertTitle>{review.errorCount} rows could not be read and will not be imported</AlertTitle>
      <AlertDescription>
        <details className='mt-1'>
          <summary className='cursor-pointer'>Show unreadable rows</summary>
          <ul className='mt-2 list-disc pl-4'>
            {review.errorSamples.map((candidate) => (
              <li key={candidate.rowNumber}>
                Row {candidate.rowNumber}: {candidate.errors}
              </li>
            ))}
          </ul>
        </details>
        {requiresConfirmation && (
          <div className='mt-3 flex items-center gap-2'>
            <Checkbox checked={accepted} id={id} onCheckedChange={(checked) => onAccept(checked === true)} />
            <Label htmlFor={id}>Import the readable rows anyway</Label>
          </div>
        )}
      </AlertDescription>
    </Alert>
  );
}

function ReviewLoadingState({
  isError,
  isLoading,
  onRetry,
}: {
  isError: boolean;
  isLoading: boolean;
  onRetry: () => void;
}) {
  if (isError) {
    return (
      <Alert variant='destructive' className='mx-4 mb-4 w-auto'>
        <AlertTitle>Transactions could not be loaded</AlertTitle>
        <AlertDescription>
          <Button variant='outline' onClick={onRetry}>
            Try again
          </Button>
        </AlertDescription>
      </Alert>
    );
  }
  if (isLoading) {
    return (
      <div role='status' className='flex justify-center p-8'>
        <SpinnerIcon className='size-5 animate-spin' />
        Loading transactions…
      </div>
    );
  }
  return null;
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

function MonthSelection({
  job,
  included,
  months,
  isPending,
  onToggle,
  onCancel,
  onContinue,
}: {
  job: ImportJob;
  included: Set<string>;
  months: Set<string>;
  isPending: boolean;
  onToggle: (month: string, checked: boolean) => void;
  onCancel: () => void;
  onContinue: () => void;
}) {
  return (
    <div className='space-y-6'>
      <section aria-label='Months to import' className='space-y-4'>
        <p className='text-muted-foreground text-sm'>
          Saving replaces previously imported transactions in the selected months. Manually added transactions stay.
        </p>
        <div className='space-y-3'>
          {job.fullMonths.map((month) => (
            <div key={month} className='flex items-center gap-3 rounded-md border px-4 py-4 text-sm'>
              <Checkbox checked disabled aria-label={`${formatImportMonth(month)} included`} />
              <span className='flex-1 font-medium'>{formatImportMonth(month)}</span>
              <span className='text-muted-foreground text-xs'>Complete month · included</span>
            </div>
          ))}
          {job.edgeMonths.map((month) => (
            <EdgeMonth
              key={month}
              checked={included.has(month)}
              month={month}
              onCheckedChange={(checked) => onToggle(month, checked)}
            />
          ))}
        </div>
        <p className='text-muted-foreground min-h-10 text-sm' aria-live='polite'>
          {months.size === 0
            ? 'Select at least one month to continue.'
            : `${months.size} ${months.size === 1 ? 'month' : 'months'} selected. You can check the transactions next.`}
        </p>
      </section>
      <div className='flex items-center justify-between gap-3 border-t pt-5'>
        <Button disabled={isPending} variant='ghost' onClick={() => onCancel()}>
          Cancel import
        </Button>
        <Button disabled={isPending || months.size === 0} onClick={() => onContinue()}>
          Continue to review
        </Button>
      </div>
    </div>
  );
}

/** Credit card statements found in the file; they count as offset only when the user confirms it per row. */
function CardSettlements({ count, months, importId }: { count: number; months: string; importId: string }) {
  const spaceId = useSpaceId();
  const [open, setOpen] = useState(false);
  const [page, setPage] = useState(1);
  const { data, isFetching, isError, refetch } = useQuery({
    ...importCandidatesQueryOptions(spaceId, importId, { months, page, cardSettlementsOnly: true }),
    enabled: open && count > 0,
    placeholderData: keepPreviousData,
  });
  if (count === 0) {
    return null;
  }
  return (
    <details className='border-t px-4 py-3' onToggle={(event) => setOpen(event.currentTarget.open)}>
      <summary className='cursor-pointer text-sm font-medium'>
        <CreditCard className='mr-2 inline size-4' />
        {count === 1 ? 'A credit card statement was found' : `${count} credit card statements were found`}
      </summary>
      <div className='space-y-3 pt-3 text-sm' aria-busy={isFetching}>
        <p className='text-muted-foreground'>
          If you import the single purchases of the card separately, tick the statement so it only offsets them and is
          not counted twice. Otherwise leave it unticked and it counts as an expense.
        </p>
        {isError && (
          <Button variant='outline' onClick={() => void refetch()}>
            Retry card statements
          </Button>
        )}
        {!data && !isError && <p role='status'>Loading card statements…</p>}
        <div inert={isFetching} className='space-y-2'>
          {data?.items.map((statement) => (
            <CardSettlementOption key={statement.id} candidate={statement} importId={importId} />
          ))}
        </div>
        {data && (
          <ImportCandidatePagination
            data={data}
            isFetching={isFetching}
            onPageChange={setPage}
            label='Card statement pages'
          />
        )}
      </div>
    </details>
  );
}

function CardSettlementOption({ candidate, importId }: { candidate: ImportCandidate; importId: string }) {
  const spaceId = useSpaceId();
  const updateMutation = useMutation(updateImportCandidateMutationOptions(spaceId));
  const id = useId();

  function onCheckedChange(checked: boolean) {
    updateMutation.mutate(
      {
        candidate: { categoryId: candidate.categoryId ?? null, countsAsOffset: checked, excluded: candidate.excluded },
        candidateId: candidate.id,
        importId,
      },
      { onError: (error) => toast.error(error.name, { description: error.message }) },
    );
  }

  return (
    <div className='flex items-center gap-2'>
      <Checkbox
        checked={candidate.countsAsOffset}
        disabled={updateMutation.isPending}
        id={id}
        onCheckedChange={(checked) => onCheckedChange(checked === true)}
      />
      <Label className='font-normal' htmlFor={id}>
        {candidate.bookingDate} · {candidate.purpose ?? candidate.counterparty} ·{' '}
        {formatStringToCurrency(candidate.amount ?? 0)} — purchases imported separately
      </Label>
    </div>
  );
}

function EdgeMonth({
  checked,
  month,
  onCheckedChange,
}: {
  checked: boolean;
  month: string;
  onCheckedChange: (checked: boolean) => void;
}) {
  const id = useId();
  return (
    <Label
      htmlFor={id}
      className={cn(
        'flex w-full cursor-pointer items-center gap-3 rounded-md border px-4 py-4 text-sm',
        checked ? 'border-primary/40 bg-primary/5' : 'border-amber-500/50 bg-amber-500/5',
      )}
    >
      <Checkbox
        aria-label={`Confirm complete export for ${formatImportMonth(month)}`}
        checked={checked}
        id={id}
        onCheckedChange={(value) => onCheckedChange(value === true)}
      />
      <span className='space-y-1'>
        <span className='block'>
          {formatImportMonth(month)} <span className='text-muted-foreground font-normal'>· needs confirmation</span>
        </span>
        <span className='text-muted-foreground block text-xs font-normal'>
          I confirm the export covers the complete month
        </span>
      </span>
    </Label>
  );
}
