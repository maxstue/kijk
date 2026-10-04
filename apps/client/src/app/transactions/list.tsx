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
import { withCategory } from '@/app/transactions/helpers';
import { noneValue } from '@/app/transactions/schemas';
import { useDeleteTransaction, useUpdateTransaction } from '@/app/transactions/use-transaction-mutations';
import { categoriesQueryOptions } from '@/shared/api/categories/options';
import { HouseholdPermissions } from '@/shared/api/households/permissions';
import { transactionsQueryOptions } from '@/shared/api/transactions/options';
import type { Transaction, TransactionFilters } from '@/shared/api/transactions/types';
import { useHouseholdPermission } from '@/shared/hooks/use-household-permission';
import { formatStringToCurrency } from '@/shared/utils/format';

/** Table of the transactions matching `filters`, with inline categorizing, editing and deleting. */
export function TransactionList({ filters }: { filters: TransactionFilters }) {
  const { data } = useSuspenseQuery(transactionsQueryOptions(filters));

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
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>Date</TableHead>
          <TableHead>Counterparty</TableHead>
          <TableHead>Category</TableHead>
          <TableHead className='text-right'>Amount</TableHead>
          <TableHead className='w-24' />
        </TableRow>
      </TableHeader>
      <TableBody>
        {data.map((transaction) => (
          <TransactionRow key={transaction.id} transaction={transaction} />
        ))}
      </TableBody>
    </Table>
  );
}

function TransactionRow({ transaction }: { transaction: Transaction }) {
  const canRecord = useHouseholdPermission(HouseholdPermissions.finances.record);
  const amount = Number(transaction.amount);

  return (
    <TableRow>
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
  const updateMutation = useUpdateTransaction();

  function onChange(value: string) {
    const categoryId = value === noneValue ? null : value;
    updateMutation.mutate(
      { id: transaction.id, transaction: withCategory(transaction, categoryId) },
      { onError: (error) => toast.error(error.name, { description: error.message }) },
    );
  }

  return (
    <Select
      disabled={disabled || updateMutation.isPending}
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
