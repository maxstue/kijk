import { PropsWithChildren, Suspense } from 'react';
import { SelectLabel } from '@radix-ui/react-select';
import { ControllerRenderProps, SubmitErrorHandler, SubmitHandler, UseFormReturn } from 'react-hook-form';

import { TransactionFormValues } from '@/app/budget/schemas';
import { useGetCategories } from '@/app/settings/categories/use-get-categories';
import { DatePicker } from '@/shared/components/date-picker';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/shared/components/ui/form/form';
import { Input } from '@/shared/components/ui/input';
import { AsyncLoader } from '@/shared/components/ui/loaders/async-loader';
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/shared/components/ui/select';
import { TransactionType } from '@/shared/types/app';

interface Props extends PropsWithChildren {
  form: UseFormReturn<TransactionFormValues>;
  onSubmit: SubmitHandler<TransactionFormValues>;
  onInvalid?: SubmitErrorHandler<TransactionFormValues>;
}

export function TransactionForm({ form, onSubmit, onInvalid, children }: Props) {
  return (
    <Form form={form} onSubmit={onSubmit} onInvalid={onInvalid} className='space-y-4'>
      <FormField control={form.control} name='name' render={NameField} />
      <FormField control={form.control} name='amount' render={AmountField} />
      <FormField control={form.control} name='type' render={TypeField} />
      <FormField control={form.control} name='categoryId' render={CategorySelectField} />
      <FormField control={form.control} name='executedAt' render={ExecutedAtField} />

      {children}
    </Form>
  );
}

function NameField({ field }: { field: ControllerRenderProps<TransactionFormValues, 'name'> }) {
  return (
    <FormItem>
      <FormLabel>Name</FormLabel>
      <FormControl>
        <Input placeholder='Name' {...field} />
      </FormControl>
      <FormMessage />
    </FormItem>
  );
}

function AmountField({ field }: { field: ControllerRenderProps<TransactionFormValues, 'amount'> }) {
  return (
    <FormItem>
      <FormLabel>Amount</FormLabel>
      <FormControl>
        <Input type='number' placeholder='Amount of money' {...field} onChange={field.onChange} />
      </FormControl>
      <FormMessage />
    </FormItem>
  );
}

function TypeField({ field }: { field: ControllerRenderProps<TransactionFormValues, 'type'> }) {
  return (
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
  );
}

function CategorySelectField({ field }: { field: ControllerRenderProps<TransactionFormValues, 'categoryId'> }) {
  const categoryQuery = useGetCategories();

  return (
    <>
      <Suspense fallback={<AsyncLoader className='h-4 w-4' />}>
        <FormItem>
          <FormLabel>Category</FormLabel>
          <Select onValueChange={field.onChange} defaultValue={field.value}>
            <FormControl>
              <SelectTrigger>
                <SelectValue placeholder='Select a category' />
              </SelectTrigger>
            </FormControl>
            <SelectContent className='h-[calc(100dvh_*_0.3)] overflow-auto p-1'>
              {Object.entries(categoryQuery.data.data ?? {}).map(([key, values]) => (
                <SelectGroup key={key}>
                  <SelectLabel className='p-1 font-bold'>{key}</SelectLabel>
                  {values.length > 0 ? (
                    values.map((x) => (
                      <SelectItem key={x.id} value={x.id}>
                        <div className='flex items-center justify-start gap-2'>
                          <div className={'h-3 w-3 rounded-full p-1'} style={{ backgroundColor: x.color }} />
                          <span>{x.name}</span>
                        </div>
                      </SelectItem>
                    ))
                  ) : (
                    <div className='flex items-center justify-center gap-2'>
                      <div className='text-primary'>No items available</div>
                    </div>
                  )}
                </SelectGroup>
              ))}
            </SelectContent>
          </Select>
          <FormMessage />
        </FormItem>
      </Suspense>
    </>
  );
}

function ExecutedAtField({ field }: { field: ControllerRenderProps<TransactionFormValues, 'executedAt'> }) {
  return (
    <FormItem>
      <FormLabel>Execution date</FormLabel>
      <DatePicker date={field.value} setDate={field.onChange} {...field} />
      <FormMessage />
    </FormItem>
  );
}
