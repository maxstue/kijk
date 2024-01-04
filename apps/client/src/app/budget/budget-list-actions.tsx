import { Suspense, useState } from 'react';
import { Row } from '@tanstack/react-table';
import { parseISO } from 'date-fns';
import { MoreHorizontal } from 'lucide-react';

import { TransactionFormValues, transactionSchema } from '@/app/budget/schemas';
import { useDeleteTransaction } from '@/app/budget/use-delete-transaction';
import { useUpdateTransaction } from '@/app/budget/use-update-transaction';
import { useGetCategories } from '@/app/settings/categories/use-get-categories';
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
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form/form';
import { useZodForm } from '@/components/ui/form/use-zod-form';
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
  const searchParams = budgetRoute.useSearch();
  const { toast } = useToast();
  const month = (searchParams.month ?? months[new Date().getMonth()]) as Months;
  const year = searchParams.year ?? new Date().getFullYear();
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
  const form = useZodForm({
    values: { ...transaction, categoryId: transaction.category?.id, executedAt: parseISO(transaction.executedAt) },
    mode: 'onBlur',
    schema: transactionSchema,
  });

  const categoryQuery = useGetCategories();
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
        <Form form={form} onSubmit={onSubmit} onInvalid={handleError} className='space-y-8'>
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
                  <Input type='number' placeholder='Amount of money' {...field} onChange={field.onChange} />
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
            name='categoryId'
            render={({ field }) => (
              <FormItem>
                <FormLabel>Category</FormLabel>
                <Select onValueChange={field.onChange} defaultValue={field.value}>
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue placeholder='Select a category' />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    {categoryQuery.data.data?.map((x) => (
                      <SelectItem key={x.id} value={x.id}>
                        <div className='flex w-full items-center gap-2'>
                          <div style={{ backgroundColor: x.color }} className='h-3 w-3 rounded'></div>
                          {x.name}
                        </div>
                      </SelectItem>
                    ))}
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
              {updateTransaction.isPending && <Icons.spinner className='animate-spin' />}
            </SheetFooter>
          </div>
        </Form>
      </div>
    </>
  );
}
