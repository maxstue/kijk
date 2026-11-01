import * as importsOptions from '@kijk/api/imports/options';
import type { ImportCandidate } from '@kijk/api/imports/types';
import { Button } from '@kijk/ui/components/button';
import { Checkbox } from '@kijk/ui/components/checkbox';
import { Label } from '@kijk/ui/components/label';
import { keepPreviousData, useMutation, useQuery } from '@tanstack/react-query';
import { CreditCard } from 'lucide-react';
import { useId, useState } from 'react';
import { toast } from 'sonner';

import { ImportCandidatePagination } from '@/app/imports/candidate-table';
import { useSpaceId } from '@/shared/hooks/use-active-space';
import { formatStringToCurrency } from '@/shared/utils/format';

interface CardSettlementsProps {
  count: number;
  months: string;
  importId: string;
}

/** Credit card statements found in the file; they count as offset only when the user confirms it per row. */
export function CardSettlements({ count, months, importId }: CardSettlementsProps) {
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

interface CardSettlementOptionProps {
  candidate: ImportCandidate;
  importId: string;
}

function CardSettlementOption({ candidate, importId }: CardSettlementOptionProps) {
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
