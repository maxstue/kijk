import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';

import { TransactionFormValues, transactionSchema } from '@/app/budget/schemas';
import { useCreateTransaction } from '@/app/budget/use-create-transaction';
import { Icons } from '@/components/icons';
import { Button } from '@/components/ui/button';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import { getMonthFromString } from '@/lib/utils';
import { Months, TransactionType } from '@/types/app';

interface Props {
  year: number;
  month: Months;
  onClose?: () => void;
}

export function TransactionCreateForm({ month, year, onClose }: Props) {
  const { isPending, mutate } = useCreateTransaction();
  const { toast } = useToast();

  const creationDate = new Date(`${Number(year)}-${getMonthFromString(month ?? 'april')}-${new Date().getDate()}`);

  const form = useForm<TransactionFormValues>({
    resolver: zodResolver(transactionSchema),
    defaultValues: {
      name: '',
      amount: 0,
      type: 'Expense',
      executedAt: creationDate,
    },
    mode: 'onBlur',
  });

  function onSubmit(data: TransactionFormValues) {
    mutate(
      { year: year, month: month, newTransaction: { ...data, categoryIds: [] } },
      {
        onError(error) {
          toast({ title: error.name, description: error.message, variant: 'destructive' });
        },
        onSuccess() {
          toast({
            title: 'Successfully created',
            variant: 'default',
          });
          onClose?.();
        },
      },
    );
  }

  return (
    <div>
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

          <Button type='submit' disabled={isPending}>
            Add
          </Button>
          {isPending && <Icons.spinner className='h-5 w-5 animate-spin' />}
        </form>
      </Form>
    </div>
  );
}
