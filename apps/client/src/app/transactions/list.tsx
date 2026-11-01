import * as transactionsOptions from '@kijk/api/transactions/options';
import type { TransactionPageQuery } from '@kijk/api/transactions/types';
import { Checkbox } from '@kijk/ui/components/checkbox';
import { Table, TableBody, TableHead, TableHeader, TableRow } from '@kijk/ui/components/table';
import { useSuspenseQuery } from '@tanstack/react-query';
import { useState } from 'react';

import { TransactionEmptyState } from '@/app/transactions/empty-state';
import { useSpaceId } from '@/shared/hooks/use-active-space';

import { BulkCategoryBar } from './bulk-category-bar';
import type { PageSize } from './pagination';
import { Pagination } from './pagination';
import { TransactionRow } from './row';
import { TotalsFooter } from './totals-footer';

interface TransactionListProps {
  onPageChange: (page: number) => void;
  onPageSizeChange: (pageSize: PageSize) => void;
  query: TransactionPageQuery;
  selectable?: boolean;
}

/**
 * Table of one page of the transactions matching `query`, with inline categorizing, editing and deleting. `selectable`
 * adds checkboxes for assigning one category to several transactions of the page at once.
 */
export function TransactionList({ onPageChange, onPageSizeChange, query, selectable = false }: TransactionListProps) {
  const spaceId = useSpaceId();
  const { data: page, isFetching } = useSuspenseQuery(transactionsOptions.listQueryOptions(spaceId, query));
  const data = page.items;
  const [selectedIds, setSelectedIds] = useState<ReadonlySet<string>>(new Set());
  // Transactions that left the list, e.g. because they got a category, are no longer selected.
  const selected = data.filter((transaction) => selectedIds.has(transaction.id)).map((transaction) => transaction.id);
  const allSelected = data.length > 0 && selected.length === data.length;

  function toggle(id: string, checked: boolean) {
    setSelectedIds((previous) => {
      const next = new Set(previous);
      if (checked) {
        next.add(id);
      } else {
        next.delete(id);
      }
      return next;
    });
  }

  if (data.length === 0) {
    return <TransactionEmptyState query={query} />;
  }

  return (
    <div className='space-y-3'>
      <Table>
        <TableHeader>
          <TableRow>
            {selectable && (
              <TableHead className='w-10'>
                <Checkbox
                  aria-label='Select all transactions on this page'
                  checked={allSelected}
                  onCheckedChange={(checked) =>
                    setSelectedIds(checked === true ? new Set(data.map((transaction) => transaction.id)) : new Set())
                  }
                />
              </TableHead>
            )}
            <TableHead>Date</TableHead>
            <TableHead>Counterparty</TableHead>
            <TableHead>Category</TableHead>
            <TableHead className='text-right'>Amount</TableHead>
            <TableHead className='w-24' />
          </TableRow>
        </TableHeader>
        <TableBody>
          {data.map((transaction) => (
            <TransactionRow
              key={transaction.id}
              selection={
                selectable
                  ? { checked: selectedIds.has(transaction.id), onChange: (checked) => toggle(transaction.id, checked) }
                  : undefined
              }
              transaction={transaction}
            />
          ))}
        </TableBody>
        <TotalsFooter
          incoming={Number(page.incoming)}
          labelColumns={selectable ? 4 : 3}
          outgoing={Number(page.outgoing)}
          totalCount={Number(page.totalCount)}
        />
      </Table>
      <Pagination
        isPending={isFetching}
        page={Number(page.page)}
        pageSize={Number(page.pageSize)}
        totalCount={Number(page.totalCount)}
        onPageChange={onPageChange}
        onPageSizeChange={onPageSizeChange}
      />
      {selected.length > 0 && (
        <BulkCategoryBar
          selectedIds={selected}
          selectedTransactions={data.filter((transaction) => selectedIds.has(transaction.id))}
          onDone={() => setSelectedIds(new Set())}
        />
      )}
    </div>
  );
}
