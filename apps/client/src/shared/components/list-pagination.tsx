import { Button } from '@kijk/ui/components/button';

interface Props {
  page: number | string;
  pageSize: number | string;
  totalCount: number | string;
  isFetching: boolean;
  onPageChange: (page: number) => void;
}

/** Navigation using the page actually returned by the server, including after deletions. */
export function ListPagination({ page, pageSize, totalCount, isFetching, onPageChange }: Props) {
  const current = Number(page);
  const count = Number(totalCount);
  const size = Number(pageSize);
  return (
    <nav aria-label='List pages' className='flex flex-wrap items-center justify-between gap-3 py-3'>
      <p aria-live='polite' className='text-muted-foreground text-sm'>
        {count === 0 ? 'No results' : `Rows ${(current - 1) * size + 1}–${Math.min(current * size, count)} of ${count}`}
      </p>
      <div className='flex gap-2'>
        <Button
          variant='outline'
          size='sm'
          disabled={isFetching || current <= 1}
          onClick={() => onPageChange(current - 1)}
        >
          Previous
        </Button>
        <Button
          variant='outline'
          size='sm'
          disabled={isFetching || current * size >= count}
          onClick={() => onPageChange(current + 1)}
        >
          Next
        </Button>
      </div>
    </nav>
  );
}
