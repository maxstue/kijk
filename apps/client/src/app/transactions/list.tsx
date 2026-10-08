import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@kijk/ui/components/alert-dialog';
import { Badge } from '@kijk/ui/components/badge';
import { Button } from '@kijk/ui/components/button';
import { Card, CardContent } from '@kijk/ui/components/card';
import { Checkbox } from '@kijk/ui/components/checkbox';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@kijk/ui/components/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@kijk/ui/components/select';
import { Separator } from '@kijk/ui/components/separator';
import { Table, TableBody, TableCell, TableFooter, TableHead, TableHeader, TableRow } from '@kijk/ui/components/table';
import { useSuspenseQuery } from '@tanstack/react-query';
import { cn } from 'cn';
import { Pencil, ReceiptText, Trash2, X } from 'lucide-react';
import { useState } from 'react';
import { toast } from 'sonner';

import { transactionPageSizes } from '@/app/transactions/constants';
import { TransactionForm } from '@/app/transactions/form';
import { RememberDialog } from '@/app/transactions/remember-dialog';
import { noneValue } from '@/app/transactions/schemas';
import {
  useCategorizeTransaction,
  useCategorizeTransactions,
  useDeleteTransaction,
} from '@/app/transactions/use-transaction-mutations';
import { categoriesQueryOptions } from '@/shared/api/categories/options';
import { SpacePermissions } from '@/shared/api/spaces/permissions';
import { transactionsQueryOptions } from '@/shared/api/transactions/options';
import type { Transaction, TransactionPageQuery } from '@/shared/api/transactions/types';
import { useSpacePermission } from '@/shared/hooks/use-space-permission';
import { formatStringToCurrency } from '@/shared/utils/format';

/**
 * Table of one page of the transactions matching `query`, with inline categorizing, editing and deleting. `selectable`
 * adds checkboxes for assigning one category to several transactions of the page at once.
 */
export function TransactionList({
  onPageChange,
  onPageSizeChange,
  query,
  selectable = false,
}: {
  onPageChange: (page: number) => void;
  onPageSizeChange: (pageSize: number) => void;
  query: TransactionPageQuery;
  selectable?: boolean;
}) {
  const { data: page, isFetching } = useSuspenseQuery(transactionsQueryOptions(query));
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
    return (
      <Card className='border-dashed'>
        <CardContent className='flex flex-col items-center gap-2 py-12 text-center'>
          <ReceiptText className='text-muted-foreground size-8' />
          <p className='font-medium'>{query.uncategorized ? 'Everything is categorized' : 'No transactions'}</p>
          <p className='text-muted-foreground text-sm'>
            {query.uncategorized
              ? 'All transactions of this month have a category.'
              : query.categoryIds?.length
                ? 'No transactions in the selected categories this month.'
                : 'Record a transaction to fill your budget overview.'}
          </p>
        </CardContent>
      </Card>
    );
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

/** Sums of all transactions matching the filters, across every page. */
function TotalsFooter({
  incoming,
  labelColumns,
  outgoing,
  totalCount,
}: {
  incoming: number;
  /** Number of columns left of the amount column. */
  labelColumns: number;
  outgoing: number;
  totalCount: number;
}) {
  const net = incoming + outgoing;

  return (
    <TableFooter>
      <TableRow>
        <TableCell colSpan={labelColumns}>
          <div className='flex flex-wrap items-baseline gap-x-4 gap-y-1'>
            <span className='font-medium'>
              Total · {totalCount} {totalCount === 1 ? 'transaction' : 'transactions'}
            </span>
            <span className='text-muted-foreground text-xs font-normal'>
              <span className='text-emerald-600'>{formatStringToCurrency(incoming)}</span> in ·{' '}
              {formatStringToCurrency(outgoing)} out
            </span>
          </div>
        </TableCell>
        <TableCell className={cn('text-right font-semibold whitespace-nowrap', net > 0 && 'text-emerald-600')}>
          {formatStringToCurrency(net)}
        </TableCell>
        <TableCell />
      </TableRow>
    </TableFooter>
  );
}

function Pagination({
  isPending,
  onPageChange,
  onPageSizeChange,
  page,
  pageSize,
  totalCount,
}: {
  isPending: boolean;
  onPageChange: (page: number) => void;
  onPageSizeChange: (pageSize: number) => void;
  page: number;
  pageSize: number;
  totalCount: number;
}) {
  const totalPages = Math.max(1, Math.ceil(totalCount / pageSize));

  return (
    <div className='flex flex-wrap items-center justify-between gap-2 py-4 text-sm'>
      <span className='text-muted-foreground'>
        Page {page} of {totalPages} · {totalCount} transactions
      </span>
      <div className='flex flex-wrap items-center gap-2'>
        <Select value={String(pageSize)} onValueChange={(value) => onPageSizeChange(Number(value))}>
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

/**
 * Floating bar for the selected transactions, shown only while some are selected: assigns one category to all of them,
 * which counts as set by hand.
 */
function BulkCategoryBar({
  onDone,
  selectedIds,
  selectedTransactions,
}: {
  onDone: () => void;
  selectedIds: string[];
  selectedTransactions: Transaction[];
}) {
  const { data: categories } = useSuspenseQuery(categoriesQueryOptions());
  const categorizeMutation = useCategorizeTransactions();
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
      <Select value={categoryId ?? ''} onValueChange={setCategoryId}>
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

/** Net sum of the selected transactions plus incoming and outgoing, always shown to keep the bar steady. */
function SelectionTotals({ transactions }: { transactions: Transaction[] }) {
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

function TransactionRow({
  selection,
  transaction,
}: {
  selection?: { checked: boolean; onChange: (checked: boolean) => void };
  transaction: Transaction;
}) {
  const canRecord = useSpacePermission(SpacePermissions.finances.record);
  const amount = Number(transaction.amount);

  return (
    <TableRow>
      {selection && (
        <TableCell>
          <Checkbox
            aria-label='Select transaction'
            checked={selection.checked}
            onCheckedChange={(checked) => selection.onChange(checked === true)}
          />
        </TableCell>
      )}
      <TableCell className='whitespace-nowrap'>
        {new Date(`${transaction.bookingDate}T00:00:00`).toLocaleDateString(undefined, { dateStyle: 'medium' })}
      </TableCell>
      <TableCell>
        <div className='font-medium'>{transaction.counterparty ?? '—'}</div>
        {transaction.purpose && (
          <div className='text-muted-foreground max-w-80 truncate text-xs'>{transaction.purpose}</div>
        )}
        <div className='mt-1 flex flex-wrap gap-1'>
          {transaction.status === 'Pending' && <Badge variant='outline'>Pending</Badge>}
          {transaction.isTransfer && <Badge variant='outline'>Transfer</Badge>}
          {transaction.accountName && <Badge variant='secondary'>{transaction.accountName}</Badge>}
        </div>
      </TableCell>
      <TableCell>
        <CategorySelect disabled={!canRecord} transaction={transaction} />
      </TableCell>
      <TableCell className={cn('text-right font-medium whitespace-nowrap', amount > 0 && 'text-emerald-600')}>
        {formatStringToCurrency(amount)}
      </TableCell>
      <TableCell>
        <div className='flex justify-end gap-1'>
          <EditButton disabled={!canRecord} transaction={transaction} />
          <DeleteButton disabled={!canRecord} transaction={transaction} />
        </div>
      </TableCell>
    </TableRow>
  );
}

function CategorySelect({ disabled, transaction }: { disabled: boolean; transaction: Transaction }) {
  const { data: categories } = useSuspenseQuery(categoriesQueryOptions());
  const categorizeMutation = useCategorizeTransaction();
  const [rememberTarget, setRememberTarget] = useState<{ categoryId: string; transaction: Transaction }>();

  function onChange(value: string) {
    const categoryId = value === noneValue ? null : value;
    categorizeMutation.mutate(
      { correction: { categoryId, remember: false }, id: transaction.id },
      {
        onError: (error) => toast.error(error.name, { description: error.message }),
        onSuccess: ({ transaction: updated }) => {
          if (!categoryId || (!updated.rememberScope && updated.rememberKeywords.length === 0)) {
            return;
          }
          toast.success('Only this transaction was changed', {
            action: { label: 'Remember…', onClick: () => setRememberTarget({ categoryId, transaction: updated }) },
          });
        },
      },
    );
  }

  const rememberCategoryName = categories.find((category) => category.id === rememberTarget?.categoryId)?.name ?? '';
  return (
    <>
      {rememberTarget && (
        <RememberDialog
          categoryId={rememberTarget.categoryId}
          categoryName={rememberCategoryName}
          transaction={rememberTarget.transaction}
          onClose={() => setRememberTarget(undefined)}
        />
      )}
      <Select
        disabled={disabled || categorizeMutation.isPending}
        value={transaction.categoryId ?? noneValue}
        onValueChange={onChange}
      >
        <SelectTrigger aria-label='Category' className='w-44' size='sm'>
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value={noneValue}>Uncategorized</SelectItem>
          {categories.map((category) => (
            <SelectItem key={category.id} value={category.id}>
              {category.name}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </>
  );
}

function EditButton({ disabled, transaction }: { disabled: boolean; transaction: Transaction }) {
  const [open, setOpen] = useState(false);

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button
          aria-label='Edit transaction'
          className='text-muted-foreground'
          disabled={disabled}
          size='icon-sm'
          variant='ghost'
        >
          <Pencil />
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Edit transaction</DialogTitle>
          <DialogDescription>Changing the category marks it as set by hand.</DialogDescription>
        </DialogHeader>
        <TransactionForm initialData={transaction} onClose={() => setOpen(false)} />
      </DialogContent>
    </Dialog>
  );
}

function DeleteButton({ disabled, transaction }: { disabled: boolean; transaction: Transaction }) {
  const deleteMutation = useDeleteTransaction();

  function onDelete() {
    deleteMutation.mutate(transaction.id, {
      onError: (error) => toast.error(error.name, { description: error.message }),
      onSuccess: () => toast.success('Transaction deleted'),
    });
  }

  return (
    <AlertDialog>
      <AlertDialogTrigger asChild>
        <Button
          aria-label='Delete transaction'
          className='text-muted-foreground hover:bg-destructive/10 hover:text-destructive focus-visible:text-destructive dark:hover:bg-destructive/20'
          disabled={disabled || deleteMutation.isPending}
          size='icon-sm'
          variant='ghost'
        >
          <Trash2 />
        </Button>
      </AlertDialogTrigger>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Delete transaction?</AlertDialogTitle>
          <AlertDialogDescription>
            {formatStringToCurrency(transaction.amount)}{' '}
            {transaction.counterparty ? `at ${transaction.counterparty}` : ''} will be removed from your budgets.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel>Cancel</AlertDialogCancel>
          <AlertDialogAction variant='destructive' onClick={onDelete}>
            Delete
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
