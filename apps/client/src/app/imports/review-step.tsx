import { Alert, AlertDescription, AlertTitle } from '@kijk/ui/components/alert';
import { Badge } from '@kijk/ui/components/badge';
import { Button } from '@kijk/ui/components/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@kijk/ui/components/card';
import { Checkbox } from '@kijk/ui/components/checkbox';
import { SpinnerIcon } from '@kijk/ui/components/icons';
import { Label } from '@kijk/ui/components/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@kijk/ui/components/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@kijk/ui/components/table';
import { useSuspenseQuery } from '@tanstack/react-query';
import { cn } from 'cn';
import { CreditCard, Sparkles, TriangleAlert } from 'lucide-react';
import { useId, useState } from 'react';
import { toast } from 'sonner';

import { ImportAiCategorization } from '@/app/imports/ai-preview';
import { formatImportMonth } from '@/app/imports/helpers';
import { useCancelImport, useCommitImport, useUpdateImportCandidate } from '@/app/imports/use-import-mutations';
import { categoriesQueryOptions } from '@/shared/api/categories/options';
import { importCandidatesQueryOptions } from '@/shared/api/imports/options';
import type { ImportCandidate, ImportJob } from '@/shared/api/imports/types';
import { formatStringToCurrency } from '@/shared/utils/format';

const shownRows = 300;
const uncategorized = 'none';

/** Step that shows what the import will change and commits it. */
export function ImportReviewStep({ job }: { job: ImportJob }) {
  const { data: candidates } = useSuspenseQuery(importCandidatesQueryOptions(job.id));
  const [includedEdgeMonths, setIncludedEdgeMonths] = useState<string[]>([]);
  const [acceptErrors, setAcceptErrors] = useState(false);
  const commitMutation = useCommitImport(job.id);
  const cancelMutation = useCancelImport(job.id);
  const acceptErrorsId = useId();

  const included = new Set(includedEdgeMonths);
  const months = new Set([...job.fullMonths, ...includedEdgeMonths]);
  const valid = candidates.filter((candidate) => candidate.errors === null);
  const invalid = candidates.filter((candidate) => candidate.errors !== null);
  const importedCount = valid.filter((candidate) => !candidate.excluded && months.has(monthOf(candidate))).length;

  function onCommit() {
    commitMutation.mutate(
      { acceptErrors, includedEdgeMonths },
      {
        onError: (error) => toast.error(error.name, { description: error.message }),
        onSuccess: (result) => toast.success(`${result.importedCount} transactions imported`),
      },
    );
  }

  return (
    <div className='space-y-6'>
      <Card>
        <CardHeader>
          <CardTitle>Months</CardTitle>
          <CardDescription>
            The file replaces all transactions of <strong>{job.accountName}</strong> in the chosen months. Include the
            first and last month only if the export covers them completely.
          </CardDescription>
        </CardHeader>
        <CardContent className='space-y-2'>
          {job.fullMonths.map((month) => (
            <div key={month} className='flex items-center gap-2 text-sm'>
              <Checkbox checked disabled /> {formatImportMonth(month)}{' '}
              <span className='text-muted-foreground'>covered completely</span>
            </div>
          ))}
          {job.edgeMonths.map((month) => (
            <EdgeMonth
              key={month}
              checked={included.has(month)}
              month={month}
              onCheckedChange={(checked) =>
                setIncludedEdgeMonths((previous) =>
                  checked ? [...previous, month] : previous.filter((item) => item !== month),
                )
              }
            />
          ))}
        </CardContent>
      </Card>
      {invalid.length > 0 && (
        <Alert variant={job.hasHighErrorRate ? 'destructive' : 'default'}>
          <TriangleAlert />
          <AlertTitle>{invalid.length} rows could not be read and will not be imported</AlertTitle>
          <AlertDescription>
            <ul className='mt-1 list-disc pl-4'>
              {invalid.slice(0, 10).map((candidate) => (
                <li key={candidate.id}>
                  Row {candidate.rowNumber}: {candidate.errors}
                </li>
              ))}
            </ul>
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
      <CardSettlements candidates={valid} importId={job.id} />
      <ImportAiCategorization job={job} />
      <CandidateTable candidates={valid} importId={job.id} months={months} />
      <div className='flex flex-wrap items-center justify-end gap-2'>
        <span className='text-muted-foreground text-sm'>{importedCount} transactions will be imported</span>
        <Button disabled={cancelMutation.isPending} variant='outline' onClick={() => cancelMutation.mutate()}>
          Cancel import
        </Button>
        <Button
          disabled={commitMutation.isPending || (job.hasHighErrorRate && !acceptErrors) || months.size === 0}
          onClick={onCommit}
        >
          {commitMutation.isPending ? <SpinnerIcon className='size-5 animate-spin' /> : 'Import'}
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
    <Alert>
      <CreditCard />
      <AlertTitle>
        {statements.length === 1
          ? 'A credit card statement was found'
          : `${statements.length} credit card statements were found`}
      </AlertTitle>
      <AlertDescription>
        <p>
          If you import the single purchases of the card separately, tick the statement so it only offsets them and is
          not counted twice. Otherwise leave it unticked and it counts as an expense.
        </p>
        <div className='mt-3 space-y-2'>
          {statements.map((statement) => (
            <CardSettlementOption key={statement.id} candidate={statement} importId={importId} />
          ))}
        </div>
      </AlertDescription>
    </Alert>
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
    <div className='flex items-center gap-2 text-sm'>
      <Checkbox checked={checked} id={id} onCheckedChange={(value) => onCheckedChange(value === true)} />
      <Label htmlFor={id}>
        {formatImportMonth(month)} <span className='text-muted-foreground font-normal'>may be covered only partly</span>
      </Label>
    </div>
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
    <Card>
      <CardHeader>
        <CardTitle>Transactions</CardTitle>
        <CardDescription>
          Categories come from your earlier corrections, remembered merchants and, if you allow it, the AI.
        </CardDescription>
      </CardHeader>
      <CardContent>
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
      </CardContent>
      {candidates.length > shownRows && (
        <CardFooter className='text-muted-foreground text-sm'>
          Showing the first {shownRows} of {candidates.length} rows; all of them are imported.
        </CardFooter>
      )}
    </Card>
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
