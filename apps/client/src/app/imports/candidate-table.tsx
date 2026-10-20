import * as categoriesOptions from '@kijk/api/categories/options';
import type { Category } from '@kijk/api/categories/types';
import * as importsOptions from '@kijk/api/imports/options';
import type { ImportCandidate, ImportCandidatePage } from '@kijk/api/imports/types';
import { Badge } from '@kijk/ui/components/badge';
import { Button } from '@kijk/ui/components/button';
import { Checkbox } from '@kijk/ui/components/checkbox';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@kijk/ui/components/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@kijk/ui/components/table';
import { useMutation, useSuspenseQuery } from '@tanstack/react-query';
import { Sparkles } from 'lucide-react';
import { toast } from 'sonner';

import { useSpaceId } from '@/shared/hooks/use-active-space';
import { formatStringToCurrency } from '@/shared/utils/format';

const uncategorized = 'none';

/** Paged transaction review with row-level editing. */
export function ImportCandidateTable({
  data,
  importId,
  isFetching,
  onPageChange,
}: {
  data: ImportCandidatePage;
  importId: string;
  isFetching: boolean;
  onPageChange: (page: number) => void;
}) {
  const spaceId = useSpaceId();
  const { data: categories } = useSuspenseQuery(categoriesOptions.listQueryOptions(spaceId));
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
          {data.items.map((candidate) => (
            <CandidateRow key={candidate.id} candidate={candidate} categories={categories} importId={importId} />
          ))}
        </TableBody>
      </Table>
      <ImportCandidatePagination data={data} isFetching={isFetching} onPageChange={onPageChange} />
    </div>
  );
}

/** Navigation for a server-provided candidate page. */
export function ImportCandidatePagination({
  data,
  isFetching,
  onPageChange,
  label = 'Transaction pages',
}: {
  data: ImportCandidatePage;
  isFetching: boolean;
  onPageChange: (page: number) => void;
  label?: string;
}) {
  const page = Number(data.page);
  const pageSize = Number(data.pageSize);
  const totalCount = Number(data.totalCount);
  if (totalCount <= pageSize) {
    return null;
  }
  const offset = (page - 1) * pageSize;
  return (
    <nav aria-label={label} className='flex flex-wrap items-center justify-between gap-3 border-t px-4 py-3'>
      <p aria-live='polite' className='text-muted-foreground text-xs'>
        Rows {offset + 1}–{Math.min(offset + pageSize, totalCount)} of {totalCount}. Saving includes all selected
        transactions in the chosen months.
      </p>
      <div className='flex gap-2'>
        <Button
          type='button'
          variant='outline'
          size='sm'
          disabled={isFetching || page === 1}
          onClick={() => onPageChange(page - 1)}
        >
          Previous rows
        </Button>
        <Button
          type='button'
          variant='outline'
          size='sm'
          disabled={isFetching || page * pageSize >= totalCount}
          onClick={() => onPageChange(page + 1)}
        >
          Next rows
        </Button>
      </div>
    </nav>
  );
}

function CandidateRow({
  candidate,
  categories,
  importId,
}: {
  candidate: ImportCandidate;
  categories: Category[];
  importId: string;
}) {
  const spaceId = useSpaceId();
  const updateMutation = useMutation(importsOptions.updateCandidateMutationOptions(spaceId));

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
    <TableRow>
      <TableCell>
        <Checkbox
          aria-label='Import this row'
          checked={!candidate.excluded}
          disabled={updateMutation.isPending}
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
          items={[
            { label: 'Uncategorized', value: uncategorized },
            ...categories.map((category) => ({ label: category.name, value: category.id })),
          ]}
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
