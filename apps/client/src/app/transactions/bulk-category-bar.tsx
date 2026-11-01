import * as categoriesOptions from '@kijk/api/categories/options';
import * as transactionsOptions from '@kijk/api/transactions/options';
import type { Transaction } from '@kijk/api/transactions/types';
import { Button } from '@kijk/ui/components/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@kijk/ui/components/select';
import { Separator } from '@kijk/ui/components/separator';
import { useMutation, useSuspenseQuery } from '@tanstack/react-query';
import { cn } from 'cn';
import { X } from 'lucide-react';
import { useState } from 'react';
import { toast } from 'sonner';

import { useSpaceId } from '@/shared/hooks/use-active-space';
import { formatStringToCurrency } from '@/shared/utils/format';

interface BulkCategoryBarProps {
  onDone: () => void;
  selectedIds: string[];
  selectedTransactions: Transaction[];
}

/**
 * Floating bar for the selected transactions, shown only while some are selected: assigns one category to all of them,
 * which counts as set by hand.
 */
export function BulkCategoryBar({ onDone, selectedIds, selectedTransactions }: BulkCategoryBarProps) {
  const spaceId = useSpaceId();
  const { data: categories } = useSuspenseQuery(categoriesOptions.listQueryOptions(spaceId));
  const categorizeMutation = useMutation(transactionsOptions.categorizeManyMutationOptions(spaceId));
  const [categoryId, setCategoryId] = useState<string>();

  function onAssign() {
    if (!categoryId) {
      return;
    }
    categorizeMutation.mutate(
      { categoryId, ids: selectedIds },
      {
        onError: (error) => toast.error(error.name, { description: error.message }),
        onSuccess: ({ updated }) => {
          toast.success(`${updated} transactions categorized`);
          onDone();
        },
      },
    );
  }

  return (
    <div
      aria-label='Selected transactions'
      className='bg-popover sticky bottom-4 z-10 mx-auto flex w-fit flex-wrap items-center gap-2 rounded-lg border p-2 shadow-lg'
      role='toolbar'
    >
      <span className='px-2 text-sm font-medium'>{selectedIds.length} selected</span>
      <SelectionTotals transactions={selectedTransactions} />
      <Separator className='h-5' orientation='vertical' />
      <Select
        items={categories.map((category) => ({ label: category.name, value: category.id }))}
        value={categoryId ?? null}
        onValueChange={(value) => setCategoryId(value ?? undefined)}
      >
        <SelectTrigger aria-label='Category for the selected transactions' className='w-48' size='sm'>
          <SelectValue placeholder='Set category…' />
        </SelectTrigger>
        <SelectContent>
          {categories.map((category) => (
            <SelectItem key={category.id} value={category.id}>
              {category.name}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
      <Button
        disabled={!categoryId || selectedIds.length === 0 || categorizeMutation.isPending}
        size='sm'
        onClick={onAssign}
      >
        Assign
      </Button>
      <Button aria-label='Clear selection' size='icon-sm' variant='ghost' onClick={onDone}>
        <X />
      </Button>
    </div>
  );
}

interface SelectionTotalsProps {
  transactions: Transaction[];
}

/** Net sum of the selected transactions plus incoming and outgoing, always shown to keep the bar steady. */
function SelectionTotals({ transactions }: SelectionTotalsProps) {
  const amounts = transactions.map((transaction) => Number(transaction.amount));
  const incoming = amounts.filter((amount) => amount > 0).reduce((sum, amount) => sum + amount, 0);
  const outgoing = amounts.filter((amount) => amount < 0).reduce((sum, amount) => sum + amount, 0);
  const net = incoming + outgoing;

  return (
    <span className='flex items-baseline gap-2 px-1 text-sm'>
      <span className={cn('font-semibold whitespace-nowrap tabular-nums', net > 0 && 'text-emerald-600')}>
        {formatStringToCurrency(net)}
      </span>
      <span className='text-muted-foreground text-xs whitespace-nowrap tabular-nums'>
        <span className='text-emerald-600'>{formatStringToCurrency(incoming)}</span> in ·{' '}
        {formatStringToCurrency(outgoing)} out
      </span>
    </span>
  );
}
