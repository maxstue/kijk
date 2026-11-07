import { Button } from '@kijk/ui/components/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@kijk/ui/components/select';

import { transactionPageSizes } from '@/app/transactions/constants';

export type PageSize = (typeof transactionPageSizes)[number];

interface PaginationProps {
  isPending: boolean;
  onPageChange: (page: number) => void;
  onPageSizeChange: (pageSize: PageSize) => void;
  page: number;
  pageSize: number;
  totalCount: number;
}

export function Pagination({ isPending, onPageChange, onPageSizeChange, page, pageSize, totalCount }: PaginationProps) {
  const totalPages = Math.max(1, Math.ceil(totalCount / pageSize));

  return (
    <div className='flex flex-wrap items-center justify-between gap-2 py-4 text-sm'>
      <span className='text-muted-foreground'>
        Page {page} of {totalPages} · {totalCount} transactions
      </span>
      <div className='flex flex-wrap items-center gap-2'>
        <Select
          items={transactionPageSizes.map((size) => ({ label: `${size} per page`, value: String(size) }))}
          value={String(pageSize)}
          onValueChange={(value) => {
            const size = transactionPageSizes.find((size) => String(size) === value);
            if (size !== undefined) {
              onPageSizeChange(size);
            }
          }}
        >
          <SelectTrigger aria-label='Transactions per page' className='w-32' size='sm'>
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {transactionPageSizes.map((size) => (
              <SelectItem key={size} value={String(size)}>
                {size} per page
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Button disabled={page <= 1 || isPending} size='sm' variant='outline' onClick={() => onPageChange(page - 1)}>
          Previous
        </Button>
        <Button
          disabled={page >= totalPages || isPending}
          size='sm'
          variant='outline'
          onClick={() => onPageChange(page + 1)}
        >
          Next
        </Button>
      </div>
    </div>
  );
}
