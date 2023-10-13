import { useState } from 'react';
import { zodResolver } from '@hookform/resolvers/zod';
import { useSearch } from '@tanstack/react-router';
import { Row } from '@tanstack/react-table';
import { parseISO } from 'date-fns';
import { MoreHorizontal } from 'lucide-react';
import { useForm } from 'react-hook-form';

import { TransactionFormValues, transactionSchema } from '@/app/budget/schemas';
import { useDeleteTransaction } from '@/app/budget/use-delete-transaction';
import { useUpdateTransaction } from '@/app/budget/use-update-transaction';
import { DatePicker } from '@/components/date-picker';
import { Icons } from '@/components/icons';
import { Button } from '@/components/ui/button';
import { Dialog } from '@/components/ui/dialog';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import {
  Sheet,
  SheetClose,
  SheetContent,
  SheetDescription,
  SheetFooter,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from '@/components/ui/sheet';
import { useToast } from '@/hooks/use-toast';
import { cn, formatStringToCurrency } from '@/lib/utils';
import { budgetRoute } from '@/routes/budget/budget-route';
import { Months, months, Transaction, TransactionType } from '@/types/app';

interface DataTableRowActionsProps<TData> {
  row: Row<TData>;
}

export function BudgetListActions<TData extends Transaction>({ row }: DataTableRowActionsProps<TData>) {
  const [showEdit, setShowEdit] = useState(false);
  const [showSheet, setShowSheet] = useState(false);
  const [sheetType, setSheetType] = useState<'edit' | 'delete'>();
  const searchParams = useSearch({ from: budgetRoute.id });
  const month = searchParams.month ?? months[new Date().getMonth()];
  const year = searchParams.year ?? new Date().getFullYear();
  const { toast } = useToast();
  const transaction = row.original;

  const handleCopyId = async () => {
    await navigator.clipboard.writeText(transaction.id);
    toast({
      title: `Successfully copied: ${row.original.name} `,
      variant: 'default',
    });
  };

  const handleClose = () => {
    setShowSheet(false);
    setSheetType(undefined);
  };

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
            <DropdownMenuItem onClick={void handleCopyId}>Copy Id</DropdownMenuItem>
            <SheetTrigger asChild onClick={() => setSheetType('edit')}>
              <DropdownMenuItem>Update</DropdownMenuItem>
            </SheetTrigger>
            <DropdownMenuSeparator />
            <SheetTrigger asChild onClick={() => setSheetType('delete')}>
              <DropdownMenuItem className={cn('focus:bg-red-500')}>Delete</DropdownMenuItem>
            </SheetTrigger>
          </DropdownMenuContent>
        </DropdownMenu>
        <SheetContent>
          {sheetType === 'delete' && (
            <Delete transaction={transaction} month={month} year={year} onClose={handleClose} />
          )}
          {sheetType === 'edit' && <Update transaction={transaction} month={month} year={year} onClose={handleClose} />}
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
    <>
      <SheetHeader>
        <SheetTitle>Delete Transaction</SheetTitle>
        <SheetDescription>This will irrevocably delete this transaction.</SheetDescription>
      </SheetHeader>
      <div>
        Transaction details:
        <div className='ml-6 flex flex-col'>
          <span>Name: {transaction.name}</span>
          <span>Amount: {formattedAmount}</span>
          <span>Type: {transaction.type}</span>
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
    </>
  );
}

function Update({ transaction, month, year, onClose }: EdProps) {
  const form = useForm<TransactionFormValues>({
    resolver: zodResolver(transactionSchema),
    values: { ...transaction, executedAt: parseISO(transaction.executedAt) },
    mode: 'onBlur',
  });
  const updateTransaction = useUpdateTransaction();
  const { toast } = useToast();

  function onSubmit(data: TransactionFormValues) {
    updateTransaction.mutate(
      { newTransaction: data, transactionId: transaction.id, month: month, year: year },
      {
        onSuccess() {
          toast({ title: `Successfully updated: ${data.name} ` });
          onClose();
        },
      },
    );
  }

  const handleError = () => {
    toast({
      title: `Error updating`,
      variant: 'destructive',
    });
  };

  return (
    <>
      <SheetHeader>
        <SheetTitle>Update {transaction.name}</SheetTitle>
        <SheetDescription>Change the values of this transaction.</SheetDescription>
      </SheetHeader>
      <div>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit, handleError)} className='space-y-8'>
            <FormField
              control={form.control}
              name='name'
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Name</FormLabel>
                  <FormControl>
                    <Input placeholder='Name' {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name='amount'
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Amount</FormLabel>
                  <FormControl>
                    <Input placeholder='Amount of money' {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name='type'
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Type</FormLabel>
                  <Select onValueChange={field.onChange} defaultValue={field.value}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder='Select a transaction type' />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value={TransactionType.EXPENSE}>Expense</SelectItem>
                      <SelectItem value={TransactionType.INCOME}>Income</SelectItem>
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name='executedAt'
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Execution date</FormLabel>
                  <DatePicker date={field.value} setDate={field.onChange} {...field} />
                  <FormMessage />
                </FormItem>
              )}
            />

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
                {updateTransaction.isPending && <Icons.spinner className='animate-spin bg-red-500' />}
              </SheetFooter>
            </div>
          </form>
        </Form>
      </div>
    </>
  );
}
