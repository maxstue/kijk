import { TransactionFormValues, transactionSchema } from '@/app/budget/schemas';
import { useCreateTransaction } from '@/app/budget/use-create-transaction';
import { useGetCategories } from '@/app/settings/categories/use-get-categories';
import { DatePicker } from '@/shared/components/date-picker';
import { Icons } from '@/shared/components/icons';
import { Button } from '@/shared/components/ui/button';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/shared/components/ui/form/form';
import { useZodForm } from '@/shared/components/ui/form/use-zod-form';
import { Input } from '@/shared/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/shared/components/ui/select';
import { useToast } from '@/shared/hooks/use-toast';
import { getMonthIndexFromString } from '@/shared/lib/utils';
import { Months, TransactionType } from '@/shared/types/app';

type TProps =
  | {
      year: number;
      month: Months;
      fromCmd?: false;
      onClose?: () => void;
    }
  | {
      fromCmd: true;
      onClose?: () => void;
    };

export function TransactionCreateForm({ fromCmd, onClose, ...props }: TProps) {
  const categoryQuery = useGetCategories();
  const { isPending, mutate } = useCreateTransaction();
  const { toast } = useToast();

  const year = 'year' in props ? props.year : new Date().getFullYear();
  const month = 'month' in props ? props.month : (new Date().toLocaleString('default', { month: 'long' }) as Months);

  const creationDate = fromCmd
    ? new Date()
    : new Date(`${Number(year)}-${getMonthIndexFromString(month ?? 'april')}-${new Date().getDate()}`);

  const form = useZodForm({
    schema: transactionSchema,
    defaultValues: {
      name: '',
      amount: 0,
      type: 'Expense',
      executedAt: creationDate,
      categoryId: undefined,
    },
    mode: 'onBlur',
  });

  function onSubmit(data: TransactionFormValues) {
    mutate(
      { newTransaction: { ...data } },
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
    <Form form={form} onSubmit={onSubmit} className='space-y-4'>
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
              <SelectContent className='h-[calc(100dvh_*_0.3)] overflow-auto p-1'>
                {categoryQuery.data.data?.map((x) => (
                  <SelectItem key={x.id} value={x.id}>
                    <div className='flex items-center justify-start gap-2'>
                      <div className={'h-3 w-3 rounded-full p-1'} style={{ backgroundColor: x.color }} />
                      <span>{x.name}</span>
                    </div>
                  </SelectItem>
                ))}
                {categoryQuery.data.data && categoryQuery.data.data.length <= 0 ? (
                  <div className='flex items-center justify-center gap-2'>
                    <div className='text-primary'>No items available</div>
                  </div>
                ) : null}
              </SelectContent>
            </Select>
            <FormMessage />
          </FormItem>
        )}
      />
      {fromCmd && (
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
      )}

      <Button type='submit' disabled={isPending}>
        {isPending ? <Icons.spinner className='h-5 w-5 animate-spin' /> : 'Add'}
      </Button>
    </Form>
  );
}
