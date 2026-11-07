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
import { Button } from '@kijk/ui/components/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@kijk/ui/components/dialog';
import { useMutation } from '@tanstack/react-query';
import { Pencil, Trash2 } from 'lucide-react';
import { useState } from 'react';
import { toast } from 'sonner';

import { TransactionForm } from '@/app/transactions/form';
import { useSpaceId } from '@/shared/hooks/use-active-space';
import { formatStringToCurrency } from '@/shared/utils/format';

interface EditButtonProps {
  disabled: boolean;
  transaction: Transaction;
}

export function EditButton({ disabled, transaction }: EditButtonProps) {
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

export function DeleteButton({ disabled, transaction }: DeleteButtonProps) {
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
