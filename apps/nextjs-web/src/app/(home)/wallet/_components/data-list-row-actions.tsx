'use client';

import { useState, useTransition } from 'react';
import { zodResolver } from '@hookform/resolvers/zod';
import { Row } from '@tanstack/react-table';
import { format, toDate } from 'date-fns';
import { Calendar as CalendarIcon, MoreHorizontal } from 'lucide-react';
import { useForm } from 'react-hook-form';

import { TransactionFormValues, transactionSchema } from '@/app/(home)/wallet/_components/schemas';
import { deleteTransaction, updateTransaction } from '@/app/(home)/wallet/actions';
import { cn } from '@/lib/classnames';
import { formatStringToCurrency } from '@/lib/utils';
import { toast } from '@/hooks/use-toast';
import { Icons } from '@/components/icons';
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
} from '@/components/ui/alert-dialog';
import { Button } from '@/components/ui/button';
import { Calendar } from '@/components/ui/calendar';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Transaction } from '@/types/app';

interface DataTableRowActionsProps<TData> {
  row: Row<TData>;
}

export function DataListRowActions<TData extends Transaction>({ row }: DataTableRowActionsProps<TData>) {
  const [showEdit, setShowEdit] = useState(false);
  const transaction = row.original;

  const handleCopyId = async () => {
    await navigator.clipboard.writeText(transaction.id);
    toast({
      title: `Successfully copied: ${row.original.name} `,
      variant: 'default',
    });
  };

  return (
    <Dialog open={showEdit} onOpenChange={setShowEdit}>
      <AlertDialog>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant='ghost' className='h-8 w-8 p-0'>
              <span className='sr-only'>Open menu</span>
              <MoreHorizontal className='h-4 w-4' />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align='end'>
            <DropdownMenuLabel>Actions</DropdownMenuLabel>
            <DropdownMenuItem onClick={handleCopyId}>Copy Id</DropdownMenuItem>
            <DialogTrigger asChild>
              <DropdownMenuItem>Update</DropdownMenuItem>
            </DialogTrigger>
            <DropdownMenuSeparator />
            <AlertDialogTrigger asChild>
              <DropdownMenuItem className={cn('focus:bg-red-500')}>Delete</DropdownMenuItem>
            </AlertDialogTrigger>
          </DropdownMenuContent>
        </DropdownMenu>

        <DeleteAlertDialog transaction={transaction} />
      </AlertDialog>
      <UpdateDialog transaction={transaction} onClose={() => setShowEdit(false)} />
    </Dialog>
  );
}

function DeleteAlertDialog({ transaction }: { transaction: Transaction }) {
  const [isPending, startTransition] = useTransition();

  const formattedAmount = formatStringToCurrency(transaction.amount);

  const handleDelete = () => {
    startTransition(async () => {
      await deleteTransaction(transaction.id);
      toast({
        title: `Successfully deleted: ${transaction.name} `,
        variant: 'default',
      });
    });
  };

  return (
    <>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Delete</AlertDialogTitle>
          <AlertDialogDescription>This will irrevocably delete this transaction.</AlertDialogDescription>
        </AlertDialogHeader>
        <div>
          Transaction details:
          <div className='ml-6 flex flex-col'>
            <span>Name: {transaction.name}</span>
            <span>Amount: {formattedAmount}</span>
            <span>Type: {transaction.type}</span>
          </div>
        </div>
        <AlertDialogFooter>
          <AlertDialogCancel disabled={isPending}>Cancel</AlertDialogCancel>
          <AlertDialogAction onClick={handleDelete} disabled={isPending}>
            Delete
          </AlertDialogAction>
          {isPending && <Icons.spinner className='animate-spin bg-red-500' />}
        </AlertDialogFooter>
      </AlertDialogContent>
    </>
  );
}

function UpdateDialog({ transaction, onClose }: { transaction: Transaction; onClose: () => void }) {
  const [isPending, startTransition] = useTransition();
  const form = useForm<TransactionFormValues>({
    resolver: zodResolver(transactionSchema),
    values: transaction,
    mode: 'onBlur',
  });

  function onSubmit(data: TransactionFormValues) {
    startTransition(async () => {
      await updateTransaction(transaction.id, data).then(() => {
        toast({
          title: `Successfully updated: ${data.name} `,
          variant: 'default',
        });
        onClose();
      });
    });
  }

  return (
    <>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Update {transaction.name}</DialogTitle>
          <DialogDescription>Change the values of this transaction.</DialogDescription>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className='space-y-8'>
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
                      <SelectItem value='EXPENSE'>Expense</SelectItem>
                      <SelectItem value='INCOME'>Income</SelectItem>
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
                <FormItem className='flex flex-col'>
                  <FormLabel>Execution date</FormLabel>
                  <Popover>
                    <PopoverTrigger asChild>
                      <FormControl>
                        <Button
                          variant={'outline'}
                          className={cn(
                            'w-[240px] pl-3 text-left font-normal',
                            !field.value && 'text-muted-foreground'
                          )}
                        >
                          {field.value ? format(toDate(field.value), 'PPP') : <span>Pick a date</span>}
                          <CalendarIcon className='ml-auto h-4 w-4 opacity-50' />
                        </Button>
                      </FormControl>
                    </PopoverTrigger>
                    <PopoverContent className='w-auto p-0' align='start'>
                      <Calendar
                        mode='single'
                        selected={field.value}
                        onSelect={field.onChange}
                        disabled={(date) => date < new Date('1900-01-01')}
                        initialFocus
                      />
                    </PopoverContent>
                  </Popover>
                  <FormDescription>Execution date of this transaction.</FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />
            <div className='flex items-center justify-end gap-2'>
              <DialogFooter>
                <Button variant='outline' onClick={onClose}>
                  Cancel
                </Button>
                <Button type='submit'>Update</Button>
              </DialogFooter>
              {isPending && <Icons.spinner className='h-5 w-5 animate-spin' />}
            </div>
          </form>
        </Form>
      </DialogContent>
    </>
  );
}
