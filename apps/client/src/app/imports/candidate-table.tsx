import * as categoriesOptions from '@kijk/api/categories/options';
import type { ImportCandidatePage } from '@kijk/api/imports/types';
import { Button } from '@kijk/ui/components/button';
import { Table, TableBody, TableHead, TableHeader, TableRow } from '@kijk/ui/components/table';
import { useSuspenseQuery } from '@tanstack/react-query';

import { useSpaceId } from '@/shared/hooks/use-active-space';

import { CandidateRow } from './candidate-row';

interface ImportCandidateTableProps {
  data: ImportCandidatePage;
  importId: string;
  isFetching: boolean;
  onPageChange: (page: number) => void;
  manualOverrides?: boolean;
}

/** Paged transaction review with row-level editing. */
export function ImportCandidateTable({
  data,
  importId,
  isFetching,
  onPageChange,
  manualOverrides = false,
}: ImportCandidateTableProps) {
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
            <CandidateRow
              key={candidate.id}
              candidate={candidate}
              categories={categories}
              importId={importId}
              manualOverrides={manualOverrides}
            />
          ))}
        </TableBody>
      </Table>
      <ImportCandidatePagination data={data} isFetching={isFetching} onPageChange={onPageChange} />
    </div>
  );
}

interface ImportCandidatePaginationProps {
  data: ImportCandidatePage;
  isFetching: boolean;
  onPageChange: (page: number) => void;
  label?: string;
}

/** Navigation for a server-provided candidate page. */
export function ImportCandidatePagination({
  data,
  isFetching,
  onPageChange,
  label = 'Transaction pages',
}: ImportCandidatePaginationProps) {
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
