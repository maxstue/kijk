import type { TransactionPageQuery } from '@kijk/api/transactions/types';
import { Card, CardContent } from '@kijk/ui/components/card';
import { ReceiptText } from 'lucide-react';

/** Empty state for the selected transaction filters. */
export function TransactionEmptyState({ query }: { query: TransactionPageQuery }) {
  let description = 'Record a transaction to fill your budget overview.';
  if (query.uncategorized) {
    description = 'All transactions of this month have a category.';
  } else if (query.categoryIds?.length) {
    description = 'No transactions in the selected categories this month.';
  }

  return (
    <Card className='border-dashed'>
      <CardContent className='flex flex-col items-center gap-2 py-12 text-center'>
        <ReceiptText className='text-muted-foreground size-8' />
        <p className='font-medium'>{query.uncategorized ? 'Everything is categorized' : 'No transactions'}</p>
        <p className='text-muted-foreground text-sm'>{description}</p>
      </CardContent>
    </Card>
  );
}
