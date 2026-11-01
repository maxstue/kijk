import * as categoriesOptions from '@kijk/api/categories/options';
import { SpacePermissions } from '@kijk/api/spaces/permissions';
import * as transactionsOptions from '@kijk/api/transactions/options';
import type { Transaction } from '@kijk/api/transactions/types';
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
import { TableCell, TableRow } from '@kijk/ui/components/table';
import { useMutation, useSuspenseQuery } from '@tanstack/react-query';
import { cn } from 'cn';
import { Pencil, Trash2 } from 'lucide-react';
import { useState } from 'react';
import { toast } from 'sonner';

import { TransactionForm } from '@/app/transactions/form';
import { RememberDialog } from '@/app/transactions/remember-dialog';
import { noneValue } from '@/app/transactions/schemas';
import { useSpaceId } from '@/shared/hooks/use-active-space';
import { useSpacePermission } from '@/shared/hooks/use-space-permission';
import { formatStringToCurrency } from '@/shared/utils/format';

interface TransactionRowProps {
  selection?: { checked: boolean; onChange: (checked: boolean) => void };
  transaction: Transaction;
}

export function TransactionRow({ selection, transaction }: TransactionRowProps) {
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

interface CategorySelectProps {
  disabled: boolean;
  transaction: Transaction;
}

function CategorySelect({ disabled, transaction }: CategorySelectProps) {
  const spaceId = useSpaceId();
  const { data: categories } = useSuspenseQuery(categoriesOptions.listQueryOptions(spaceId));
  const categorizeMutation = useMutation(transactionsOptions.categorizeMutationOptions(spaceId));
  const [rememberTarget, setRememberTarget] = useState<{ categoryId: string; transaction: Transaction }>();

  function onChange(value: string | null) {
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
        items={[
          { label: 'Uncategorized', value: noneValue },
          ...categories.map((category) => ({ label: category.name, value: category.id })),
        ]}
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

interface EditButtonProps {
  disabled: boolean;
  transaction: Transaction;
}

function EditButton({ disabled, transaction }: EditButtonProps) {
  const [open, setOpen] = useState(false);

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger
        render={
          <Button
            aria-label='Edit transaction'
            className='text-muted-foreground'
            disabled={disabled}
            size='icon-sm'
            variant='ghost'
          />
        }
      >
        <Pencil />
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

interface DeleteButtonProps {
  disabled: boolean;
  transaction: Transaction;
}

function DeleteButton({ disabled, transaction }: DeleteButtonProps) {
  const spaceId = useSpaceId();
  const deleteMutation = useMutation(transactionsOptions.deleteMutationOptions(spaceId));

  function onDelete() {
    deleteMutation.mutate(transaction.id, {
      onError: (error) => toast.error(error.name, { description: error.message }),
      onSuccess: () => toast.success('Transaction deleted'),
    });
  }

  return (
    <AlertDialog>
      <AlertDialogTrigger
        render={
          <Button
            aria-label='Delete transaction'
            className='text-muted-foreground hover:bg-destructive/10 hover:text-destructive focus-visible:text-destructive dark:hover:bg-destructive/20'
            disabled={disabled || deleteMutation.isPending}
            size='icon-sm'
            variant='ghost'
          />
        }
      >
        <Trash2 />
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
