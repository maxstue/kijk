import * as importsOptions from '@kijk/api/imports/options';
import type { ImportCandidate, ImportCandidatePage, ImportJob } from '@kijk/api/imports/types';
import { Alert, AlertDescription, AlertTitle } from '@kijk/ui/components/alert';
import { Button } from '@kijk/ui/components/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@kijk/ui/components/card';
import { Checkbox } from '@kijk/ui/components/checkbox';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@kijk/ui/components/dialog';
import { SpinnerIcon } from '@kijk/ui/components/icons';
import { Label } from '@kijk/ui/components/label';
import { keepPreviousData, useMutation, useQuery } from '@tanstack/react-query';
import { cn } from 'cn';
import { CreditCard, SlidersHorizontal, Sparkles, TriangleAlert, X } from 'lucide-react';
import { useEffect, useId, useRef, useState, type ReactNode } from 'react';
import { toast } from 'sonner';

import { ImportAiCategorization } from '@/app/imports/ai-preview';
import { ImportCandidatePagination, ImportCandidateTable } from '@/app/imports/candidate-table';
import { formatImportMonth } from '@/app/imports/helpers';
import { useSpaceId } from '@/shared/hooks/use-active-space';
import { useFeature } from '@/shared/hooks/use-feature';
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

function CategorizationProgress({ active }: { active: boolean }) {
  if (!active) {
    return null;
  }
  return (
    <output aria-label='Suggesting categories' className='bg-background/80 absolute inset-0 z-10 backdrop-blur-[1px]'>
      <div className='bg-popover sticky top-40 mx-auto flex w-fit max-w-[calc(100%-2rem)] flex-col items-center gap-2 rounded-lg border p-5 text-center shadow-sm'>
        <SpinnerIcon className='size-6 animate-spin' />
        <p className='text-sm font-medium'>Suggesting categories…</p>
        <p className='text-muted-foreground text-xs'>Please wait. Your transactions will update automatically.</p>
      </div>
    </output>
  );
}

function ReviewAdjustments({ children }: { children: ReactNode }) {
  const [expanded, setExpanded] = useState(false);
  const contentId = useId();
  return (
    <Card role='region' aria-label='Review and adjust'>
      <CardHeader className='flex flex-wrap items-center justify-between gap-4'>
        <div className='flex flex-col gap-1'>
          <CardTitle>Review &amp; adjust</CardTitle>
          <CardDescription>Optional: suggest categories, change them manually or exclude transactions.</CardDescription>
        </div>
        <Button
          variant='outline'
          aria-expanded={expanded}
          aria-controls={contentId}
          onClick={() => setExpanded((previous) => !previous)}
        >
          <SlidersHorizontal data-icon='inline-start' />
          <span className='grid'>
            <span className='invisible col-start-1 row-start-1' aria-hidden='true'>
              Adjust transactions
            </span>
            <span className='col-start-1 row-start-1'>{expanded ? 'Hide transactions' : 'Adjust transactions'}</span>
          </span>
        </Button>
      </CardHeader>
      <div id={contentId} hidden={!expanded}>
        {expanded && children}
      </div>
    </Card>
  );
}

function AiSuggestionsAction({
  enabled,
  disabled,
  onOpen,
}: {
  enabled: boolean;
  disabled: boolean;
  onOpen: () => void;
}) {
  if (!enabled) {
    return null;
  }
  return (
    <section aria-label='AI category suggestions' className='flex flex-wrap items-center gap-3'>
      <Button size='sm' variant='outline' disabled={disabled} onClick={onOpen}>
        <Sparkles data-icon='inline-start' /> Suggest categories
      </Button>
    </section>
  );
}

type ReviewActionProps = {
  accountName: string;
  months: string;
  importedCount: number;
  hint: string;
  isPending: boolean;
  isSaving: boolean;
  cannotSave: boolean;
  onBack: () => void;
  onCommit: () => void;
};

function ReviewActions({
  accountName,
  months,
  importedCount,
  hint,
  isPending,
  isSaving,
  cannotSave,
  onBack,
  onCommit,
  floating = false,
  onVisibilityChange,
}: ReviewActionProps & { floating?: boolean; onVisibilityChange?: (hidden: boolean) => void }) {
  const actions = useRef<HTMLElement>(null);
  useEffect(() => {
    const element = actions.current;
    if (!element || !onVisibilityChange) {
      return;
    }
    const observer = new IntersectionObserver(
      ([entry]) => {
        onVisibilityChange(!entry.isIntersecting && entry.boundingClientRect.bottom <= (entry.rootBounds?.top ?? 48));
      },
      { rootMargin: '-48px 0px 0px 0px' },
    );
    observer.observe(element);
    return () => observer.disconnect();
  }, [onVisibilityChange]);
  return (
    <section
      ref={actions}
      role={floating ? 'toolbar' : undefined}
      aria-label={floating ? 'Import actions while scrolling' : 'Import actions'}
      className={cn(
        '@container flex flex-col gap-3',
        floating
          ? 'bg-popover sticky bottom-4 z-10 mx-auto w-full max-w-xl min-w-0 flex-wrap rounded-lg border p-2 shadow-lg @lg:flex-row @lg:items-center'
          : 'border-b pb-4',
      )}
    >
      <div className={cn('flex min-w-0 flex-1 flex-col gap-1', floating && 'px-2')}>
        {floating && <p className='text-muted-foreground text-xs'>Step 4 of 5 · Review &amp; save</p>}
        <p className='text-sm font-medium' aria-live='polite'>
          {importedCount} transactions ready to import
        </p>
        <p className='text-muted-foreground truncate text-xs' title={`${accountName} · ${months}`}>
          {accountName} · {months}
        </p>
        {!floating && (
          <p className='text-muted-foreground min-h-12 text-sm' aria-live='polite'>
            {hint}
          </p>
        )}
      </div>
      <div className='flex shrink-0 justify-end gap-2'>
        <Button disabled={isPending} variant='outline' onClick={onBack}>
          Back
        </Button>
        <Button disabled={cannotSave} onClick={onCommit}>
          {isSaving && <SpinnerIcon className='animate-spin' data-icon='inline-start' />}
          {isSaving ? 'Starting import…' : 'Start import'}
        </Button>
      </div>
    </section>
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
      <output className='flex justify-center p-8'>
        <SpinnerIcon className='size-5 animate-spin' />
        Loading transactions…
      </output>
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
  const monthLabel = months.size === 1 ? 'month' : 'months';
  return (
    <div className='flex flex-col gap-6'>
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
            : `${months.size} ${monthLabel} selected. You can check the transactions next.`}
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
    ...importsOptions.candidatesQueryOptions(spaceId, importId, { months, page, cardSettlementsOnly: true }),
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
        {!data && !isError && <output className='block'>Loading card statements…</output>}
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
  const updateMutation = useMutation(importsOptions.updateCandidateMutationOptions(spaceId));
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
        aria-label={`Import partial month ${formatImportMonth(month)} anyway`}
        checked={checked}
        id={id}
        onCheckedChange={(value) => onCheckedChange(value === true)}
      />
      <span className='space-y-1'>
        <span className='block'>
          {formatImportMonth(month)} <span className='text-muted-foreground font-normal'>· partial month</span>
        </span>
        <span className='text-muted-foreground block text-xs font-normal'>
          The export does not appear to cover this entire month. Import these transactions anyway?
        </span>
      </span>
    </Label>
  );
}
