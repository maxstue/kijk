import { Alert, AlertDescription, AlertTitle } from '@kijk/ui/components/alert';
import { Badge } from '@kijk/ui/components/badge';
import { Button } from '@kijk/ui/components/button';
import { Checkbox } from '@kijk/ui/components/checkbox';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@kijk/ui/components/dialog';
import { SpinnerIcon } from '@kijk/ui/components/icons';
import { Label } from '@kijk/ui/components/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@kijk/ui/components/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@kijk/ui/components/table';
import { useQueryClient, useSuspenseQuery } from '@tanstack/react-query';
import { cn } from 'cn';
import { CreditCard, Sparkles, TriangleAlert } from 'lucide-react';
import { useEffect, useId, useRef, useState } from 'react';
import { toast } from 'sonner';

import { ImportAiCategorization } from '@/app/imports/ai-preview';
import { formatImportMonth } from '@/app/imports/helpers';
import { useCancelImport, useCommitImport, useUpdateImportCandidate } from '@/app/imports/use-import-mutations';
import { categoriesQueryOptions } from '@/shared/api/categories/options';
import { importCandidatesQueryOptions } from '@/shared/api/imports/options';
import type { ImportCandidate, ImportJob } from '@/shared/api/imports/types';
import { queryKeys } from '@/shared/api/query-keys';
import { formatStringToCurrency } from '@/shared/utils/format';

const shownRows = 300;
const uncategorized = 'none';

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
  const { data: candidates } = useSuspenseQuery(importCandidatesQueryOptions(job.id));
  const queryClient = useQueryClient();
  const previousStatus = useRef(job.status);
  useEffect(() => {
    if (previousStatus.current === 'Categorizing' && job.status === 'NeedsReview') {
      void queryClient.invalidateQueries({ queryKey: queryKeys.imports.candidates(job.id) });
      void queryClient.invalidateQueries({ queryKey: queryKeys.imports.aiPreview(job.id) });
    }
    previousStatus.current = job.status;
  }, [job.id, job.status, queryClient]);

  const [includedEdgeMonths, setIncludedEdgeMonths] = useState<string[]>([]);
  const [acceptErrors, setAcceptErrors] = useState(false);
  const [showAiPreview, setShowAiPreview] = useState(false);
  const commitMutation = useCommitImport(job.id);
  const cancelMutation = useCancelImport(job.id);
  const acceptErrorsId = useId();

  const included = new Set(includedEdgeMonths);
  const months = new Set([...job.fullMonths, ...includedEdgeMonths]);
  const valid = candidates.filter((candidate) => candidate.errors === null);
  const invalid = candidates.filter((candidate) => candidate.errors !== null);
  const importedCount = valid.filter((candidate) => !candidate.excluded && months.has(monthOf(candidate))).length;
  const isPending = commitMutation.isPending || cancelMutation.isPending || job.status === 'Categorizing';
  const cannotCommit = (job.hasHighErrorRate && !acceptErrors) || months.size === 0;

  function toggleEdgeMonth(month: string, checked: boolean) {
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
      <div aria-label='Import actions' className='bg-background @container sticky top-12 z-20 border-b py-3 shadow-sm'>
        <div className='grid items-center gap-3 @lg:grid-cols-[minmax(0,1fr)_auto]'>
          <div className='min-w-0 space-y-1' aria-live='polite'>
            <p className='text-sm font-medium'>
              <span className='inline-block min-w-[4ch] tabular-nums'>{importedCount}</span> transactions ready to
              import
            </p>
            <p className='text-muted-foreground min-h-8 text-xs leading-4'>{getReviewHint(job, acceptErrors)}</p>
          </div>
          <div className='flex gap-2'>
            <Button disabled={isPending} variant='outline' onClick={() => onStageChange('months')}>
              Back
            </Button>
            <Button className='flex-1 @lg:flex-none' disabled={isPending || cannotCommit} onClick={onCommit}>
              {commitMutation.isPending && <SpinnerIcon className='size-5 animate-spin' />}
              {commitMutation.isPending ? 'Saving import…' : 'Save import'}
            </Button>
          </div>
        </div>
      </div>
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
        {invalid.length > 0 && (
          <Alert className='mx-4 mb-4 w-auto' variant={job.hasHighErrorRate ? 'destructive' : 'default'}>
            <TriangleAlert />
            <AlertTitle>{invalid.length} rows could not be read and will not be imported</AlertTitle>
            <AlertDescription>
              <details className='mt-1'>
                <summary className='cursor-pointer'>Show unreadable rows</summary>
                <ul className='mt-2 list-disc pl-4'>
                  {invalid.slice(0, 10).map((candidate) => (
                    <li key={candidate.id}>
                      Row {candidate.rowNumber}: {candidate.errors}
                    </li>
                  ))}
                </ul>
              </details>
              {job.hasHighErrorRate && (
                <div className='mt-3 flex items-center gap-2'>
                  <Checkbox
                    checked={acceptErrors}
                    id={acceptErrorsId}
                    onCheckedChange={(checked) => setAcceptErrors(checked === true)}
                  />
                  <Label htmlFor={acceptErrorsId}>Import the readable rows anyway</Label>
                </div>
              )}
            </AlertDescription>
          </Alert>
        )}
        <div className='relative' aria-busy={job.status === 'Categorizing'}>
          <div inert={job.status === 'Categorizing'}>
            <CardSettlements
              candidates={valid.filter((candidate) => months.has(monthOf(candidate)))}
              importId={job.id}
            />
            <CandidateTable
              candidates={valid.filter((candidate) => months.has(monthOf(candidate)))}
              importId={job.id}
              months={months}
            />
          </div>
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
function CardSettlements({ candidates, importId }: { candidates: ImportCandidate[]; importId: string }) {
  const statements = candidates.filter((candidate) => candidate.isCardSettlement && !candidate.excluded);
  if (statements.length === 0) {
    return null;
  }

  return (
    <details className='border-t px-4 py-3'>
      <summary className='cursor-pointer text-sm font-medium'>
        <CreditCard className='mr-2 inline size-4' />
        {statements.length === 1
          ? 'A credit card statement was found'
          : `${statements.length} credit card statements were found`}
      </summary>
      <div className='space-y-3 pt-3 text-sm'>
        <p className='text-muted-foreground'>
          If you import the single purchases of the card separately, tick the statement so it only offsets them and is
          not counted twice. Otherwise leave it unticked and it counts as an expense.
        </p>
        <div className='mt-3 space-y-2'>
          {statements.map((statement) => (
            <CardSettlementOption key={statement.id} candidate={statement} importId={importId} />
          ))}
        </div>
      </div>
    </details>
  );
}

function CardSettlementOption({ candidate, importId }: { candidate: ImportCandidate; importId: string }) {
  const updateMutation = useUpdateImportCandidate(importId);
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

function CandidateTable({
  candidates,
  importId,
  months,
}: {
  candidates: ImportCandidate[];
  importId: string;
  months: Set<string>;
}) {
  return (
    <div className='border-t'>
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead className='w-10'>Import</TableHead>
            <TableHead>Date</TableHead>
            <TableHead>Counterparty</TableHead>
            <TableHead>Category</TableHead>
            <TableHead className='text-right'>Amount</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {candidates.slice(0, shownRows).map((candidate) => (
            <CandidateRow
              key={candidate.id}
              candidate={candidate}
              importId={importId}
              inMonth={months.has(monthOf(candidate))}
            />
          ))}
        </TableBody>
      </Table>
      {candidates.length > shownRows && (
        <p className='text-muted-foreground border-t px-4 py-3 text-xs'>
          Showing the first {shownRows} of {candidates.length} rows. Saving includes all selected transactions in the
          chosen months.
        </p>
      )}
    </div>
  );
}

function CandidateRow({
  candidate,
  importId,
  inMonth,
}: {
  candidate: ImportCandidate;
  importId: string;
  inMonth: boolean;
}) {
  const { data: categories } = useSuspenseQuery(categoriesQueryOptions());
  const updateMutation = useUpdateImportCandidate(importId);

  function update(change: { categoryId?: string | null; excluded?: boolean }) {
    updateMutation.mutate(
      {
        candidate: { categoryId: candidate.categoryId ?? null, excluded: candidate.excluded, ...change },
        candidateId: candidate.id,
        importId,
      },
      { onError: (error) => toast.error(error.name, { description: error.message }) },
    );
  }

  return (
    <TableRow className={cn(!inMonth && 'opacity-50')}>
      <TableCell>
        <Checkbox
          aria-label='Import this row'
          checked={!candidate.excluded && inMonth}
          disabled={!inMonth || updateMutation.isPending}
          onCheckedChange={(checked) => update({ excluded: checked !== true })}
        />
      </TableCell>
      <TableCell className='whitespace-nowrap'>{candidate.bookingDate}</TableCell>
      <TableCell>
        <div className='font-medium'>{candidate.counterparty ?? '—'}</div>
        {candidate.purpose && (
          <div className='text-muted-foreground max-w-80 truncate text-xs'>{candidate.purpose}</div>
        )}
        {candidate.status === 'Pending' && <div className='text-muted-foreground text-xs'>Pending</div>}
        {candidate.isCardSettlement && (
          <Badge className='mt-1' variant='outline'>
            {candidate.countsAsOffset ? 'Card statement · offset' : 'Card statement'}
          </Badge>
        )}
      </TableCell>
      <TableCell>
        <Select
          disabled={updateMutation.isPending}
          value={candidate.categoryId ?? uncategorized}
          onValueChange={(value) => update({ categoryId: value === uncategorized ? null : value })}
        >
          <SelectTrigger aria-label='Category' className='w-44' size='sm'>
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value={uncategorized}>Uncategorized</SelectItem>
            {categories.map((category) => (
              <SelectItem key={category.id} value={category.id}>
                {category.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        {candidate.categorySource === 'Ai' && (
          <Badge className='mt-1' variant='outline'>
            <Sparkles className='size-3' /> AI suggestion
          </Badge>
        )}
      </TableCell>
      <TableCell className='text-right whitespace-nowrap'>{formatStringToCurrency(candidate.amount ?? 0)}</TableCell>
    </TableRow>
  );
}

function monthOf(candidate: ImportCandidate) {
  return `${(candidate.bookingDate ?? '').slice(0, 7)}-01`;
}
