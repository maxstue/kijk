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
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@kijk/ui/components/table';
import { useSuspenseQuery } from '@tanstack/react-query';
import { cn } from 'cn';
import { Pencil, ReceiptText, Trash2 } from 'lucide-react';
import { useState } from 'react';
import { toast } from 'sonner';

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
import type { Transaction, TransactionFilters } from '@/shared/api/transactions/types';
import { useSpacePermission } from '@/shared/hooks/use-space-permission';
import { formatStringToCurrency } from '@/shared/utils/format';

/**
 * Table of the transactions matching `filters`, with inline categorizing, editing and deleting. `selectable` adds
 * checkboxes for assigning one category to several transactions at once.
 */
export function TransactionList({
  filters,
  selectable = false,
}: {
  filters: TransactionFilters;
  selectable?: boolean;
}) {
  const { data } = useSuspenseQuery(transactionsQueryOptions(filters));
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
          <p className='font-medium'>No transactions</p>
          <p className='text-muted-foreground text-sm'>Record a transaction to fill your budget overview.</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className='space-y-3'>
      {selectable && <BulkCategoryBar selectedIds={selected} onDone={() => setSelectedIds(new Set())} />}
      <Table>
        <TableHeader>
          <TableRow>
            {selectable && (
              <TableHead className='w-10'>
                <Checkbox
                  aria-label='Select all transactions'
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
      </Table>
    </div>
  );
}

/** Assigns one category to the selected transactions; it counts as set by hand. */
function BulkCategoryBar({ selectedIds, onDone }: { selectedIds: string[]; onDone: () => void }) {
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
    <div className='bg-muted/50 flex flex-wrap items-center gap-2 rounded-md border p-2'>
      <span className='text-muted-foreground px-1 text-sm'>{selectedIds.length} selected</span>
      <Select value={categoryId ?? ''} onValueChange={setCategoryId}>
        <SelectTrigger aria-label='Category for the selected transactions' className='w-48' size='sm'>
          <SelectValue placeholder='Choose a category' />
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
        Assign to {selectedIds.length}
      </Button>
    </div>
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
        <Button aria-label='Edit transaction' disabled={disabled} size='icon-sm' variant='ghost'>
          <Pencil />
        </Button>
      </DialogTrigger>
      <DialogContent className='max-h-[calc(100vh-2rem)] overflow-y-auto sm:max-w-lg'>
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
