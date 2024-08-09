import { Suspense, useCallback, useState } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { getRouteApi } from '@tanstack/react-router';
import { Row } from '@tanstack/react-table';
import { parseISO } from 'date-fns';
import { MoreHorizontal } from 'lucide-react';

import { TransactionFormValues, transactionSchema } from '@/app/budget/schemas';
import { TransactionForm } from '@/app/budget/transaction-form';
import { useDeleteTransaction } from '@/app/budget/use-delete-transaction';
import { useUpdateTransaction } from '@/app/budget/use-update-transaction';
import { Icons } from '@/shared/components/icons';
import { Button } from '@/shared/components/ui/button';
import { Dialog } from '@/shared/components/ui/dialog';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/shared/components/ui/dropdown-menu';
import { useZodForm } from '@/shared/components/ui/form/use-zod-form';
import {
  Sheet,
  SheetClose,
  SheetContent,
  SheetDescription,
  SheetFooter,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from '@/shared/components/ui/sheet';
import { useToast } from '@/shared/hooks/use-toast';
import { cn } from '@/shared/lib/helpers';
import { Months, months, Transaction } from '@/shared/types/app';
import { formatStringToCurrency, getMonthIndexFromString } from '@/shared/utils/format';

const route = getRouteApi('/_protected/budget');

interface DataTableRowActionsProps<TData> {
  row: Row<TData>;
}

export function BudgetListActions<TData extends Transaction>({ row }: DataTableRowActionsProps<TData>) {
  const [showEdit, setShowEdit] = useState(false);
  const [showSheet, setShowSheet] = useState(false);
  const [sheetType, setSheetType] = useState<'edit' | 'delete'>();
  const searchParams = route.useSearch();
  const { toast } = useToast();
  const month = searchParams.month ?? months[new Date().getMonth()];
  const year = searchParams.year ?? new Date().getFullYear();
  const transaction = row.original;

  const handleCopyName = async () => {
    await navigator.clipboard.writeText(transaction.name);
    toast({
      title: `Successfully copied: ${row.original.name} `,
      variant: 'default',
    });
  };

  const handleClose = useCallback(() => {
    setShowSheet(false);
    setSheetType(undefined);
  }, []);

  return (
    <Dialog open={showEdit} onOpenChange={setShowEdit}>
      <Sheet open={showSheet} onOpenChange={setShowSheet}>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant='ghost' className='h-8 w-8 p-0'>
              <span className='sr-only'>Open menu</span>
              <MoreHorizontal className='h-4 w-4' />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align='end'>
            <DropdownMenuLabel>Actions</DropdownMenuLabel>
            <DropdownMenuItem onClick={handleCopyName}>Copy Name</DropdownMenuItem>
            <SheetTrigger
              asChild
              onClick={() => {
                setSheetType('edit');
              }}
            >
              <DropdownMenuItem>Update</DropdownMenuItem>
            </SheetTrigger>
            <DropdownMenuSeparator />
            <SheetTrigger
              asChild
              onClick={() => {
                setSheetType('delete');
              }}
            >
              <DropdownMenuItem className={cn('focus:bg-red-500 focus:text-white')}>Delete</DropdownMenuItem>
            </SheetTrigger>
          </DropdownMenuContent>
        </DropdownMenu>
        <SheetContent>
          <Suspense>
            {sheetType === 'delete' && (
              <Delete transaction={transaction} month={month} year={year} onClose={handleClose} />
            )}
            {sheetType === 'edit' && (
              <Update transaction={transaction} month={month} year={year} onClose={handleClose} />
            )}
          </Suspense>
        </SheetContent>
      </Sheet>
    </Dialog>
  );
}

interface EdProps {
  transaction: Transaction;
  year: number;
  month: Months;
  onClose: () => void;
}

function Delete({ transaction, year, month, onClose }: EdProps) {
  const formattedAmount = formatStringToCurrency(transaction.amount);
  const deleteMutation = useDeleteTransaction();
  const { toast } = useToast();

  const handleDelete = () => {
    deleteMutation.mutate(
      { transactionId: transaction.id, month: month, year: year },
      {
        onSuccess() {
          toast({ title: `Successfully deleted: ${transaction.name} ` });
          onClose();
        },
      },
    );
  };

  return (
    <div className='space-y-8'>
      <SheetHeader>
        <SheetTitle>Delete Transaction</SheetTitle>
        <SheetDescription>This will irrevocably delete this transaction.</SheetDescription>
      </SheetHeader>
      <div>
        <div className='flex w-2/3 flex-col'>
          <div className='flex w-full justify-between'>
            <span className='font-bold'>Name: </span>
            <span>{transaction.name}</span>
          </div>
          <div className='flex w-full justify-between'>
            <span className='font-bold'>Amount: </span>
            <span>{formattedAmount}</span>
          </div>
          <div className='flex w-full justify-between'>
            <span className='font-bold'>Type: </span>
            <span>{transaction.type}</span>
          </div>
          <div className='flex w-full justify-between'>
            <span className='font-bold'>Category: </span>
            <span>
              <div className='flex w-full items-center gap-2'>
                <div style={{ backgroundColor: transaction.category?.color }} className='h-3 w-3 rounded'></div>
                {transaction.category?.name}
              </div>
            </span>
          </div>
        </div>
      </div>
      <SheetFooter>
        <SheetClose asChild>
          <Button type='button' variant='outline' disabled={deleteMutation.isPending}>
            Cancel
          </Button>
        </SheetClose>
        <Button type='button' className='bg-red-500' onClick={handleDelete} disabled={deleteMutation.isPending}>
          Delete
        </Button>
        {deleteMutation.isPending && <Icons.spinner className='h-5 w-5 animate-spin' />}
      </SheetFooter>
    </div>
  );
}

function Update({ transaction, month, year, onClose }: EdProps) {
  const queryClient = useQueryClient();

  const form = useZodForm({
    values: { ...transaction, categoryId: transaction.category?.id, executedAt: parseISO(transaction.executedAt) },
    mode: 'onBlur',
    schema: transactionSchema,
  });

  const updateTransaction = useUpdateTransaction();
  const { toast } = useToast();

  function onSubmit(data: TransactionFormValues) {
    updateTransaction.mutate(
      { newTransaction: data, transactionId: transaction.id },
      {
        async onSuccess() {
          await queryClient.invalidateQueries({ queryKey: ['transactions', 'getBy', year.toString(), month] });
          await queryClient.invalidateQueries({
            queryKey: ['transactions', 'getBy', year.toString(), months[getMonthIndexFromString(month) - 2]],
          });

          toast({ title: `Successfully updated: ${data.name} ` });
          onClose();
        },
      },
    );
  }

  const handleError = useCallback(() => {
    toast({
      title: `Error updating`,
      variant: 'destructive',
    });
  }, [toast]);

  return (
    <>
      <SheetHeader>
        <SheetTitle>Update {transaction.name}</SheetTitle>
        <SheetDescription>Change the values of this transaction.</SheetDescription>
      </SheetHeader>
      <div>
        <TransactionForm form={form} onSubmit={onSubmit} onInvalid={handleError}>
          <div className='flex items-center justify-end gap-2'>
            <SheetFooter>
              <SheetClose asChild>
                <Button type='button' variant='outline' disabled={updateTransaction.isPending}>
                  Cancel
                </Button>
              </SheetClose>
              <Button type='submit' disabled={updateTransaction.isPending}>
                Update
              </Button>
              {updateTransaction.isPending && <Icons.spinner className='animate-spin' />}
            </SheetFooter>
          </div>
        </TransactionForm>
      </div>
    </>
  );
}
