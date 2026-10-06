import { zodResolver } from '@hookform/resolvers/zod';
import { Button } from '@kijk/ui/components/button';
import { SpinnerIcon } from '@kijk/ui/components/icons';
import { Input } from '@kijk/ui/components/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@kijk/ui/components/select';
import { ToggleGroup, ToggleGroupItem } from '@kijk/ui/components/toggle-group';
import { useSuspenseQuery } from '@tanstack/react-query';
import { useForm } from 'react-hook-form';
import type { UseFormReturn } from 'react-hook-form';
import { toast } from 'sonner';

import { getCreateDefaultValues, toFormValues, toRequest } from '@/app/transactions/helpers';
import { noneValue, transactionSchema } from '@/app/transactions/schemas';
import type { TransactionFormValues } from '@/app/transactions/schemas';
import { useCreateTransaction, useUpdateTransaction } from '@/app/transactions/use-transaction-mutations';
import { accountsQueryOptions } from '@/shared/api/accounts/options';
import { categoriesQueryOptions } from '@/shared/api/categories/options';
import type { Transaction } from '@/shared/api/transactions/types';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/shared/components/form';
import { FormSwitchItem } from '@/shared/components/form-switch-item';

interface Props {
  initialData?: Transaction;
  onClose: () => void;
}

interface FormComponentProps {
  form: UseFormReturn<TransactionFormValues>;
}

/** Form to record a transaction, or to edit `initialData` when given. */
export function TransactionForm({ initialData, onClose }: Props) {
  const createMutation = useCreateTransaction();
  const updateMutation = useUpdateTransaction();
  const isPending = createMutation.isPending || updateMutation.isPending;
  const submitLabel = initialData ? 'Update transaction' : 'Record transaction';
  const form = useForm<TransactionFormValues>({
    defaultValues: initialData ? toFormValues(initialData) : getCreateDefaultValues(),
    resolver: zodResolver(transactionSchema),
  });

  function onSubmit(values: TransactionFormValues) {
    const onError = (error: Error) => toast.error(error.name, { description: error.message });
    const onSuccess = () => {
      toast.success(initialData ? 'Transaction updated' : 'Transaction recorded');
      onClose();
    };

    if (initialData) {
      updateMutation.mutate({ id: initialData.id, transaction: toRequest(values) }, { onError, onSuccess });
      return;
    }
    createMutation.mutate(toRequest(values), { onError, onSuccess });
  }

  return (
    <Form {...form}>
      <form className='grid gap-4' onSubmit={form.handleSubmit(onSubmit)} noValidate>
        <DirectionField form={form} />
        <div className='grid gap-4 sm:grid-cols-2'>
          <FormField
            control={form.control}
            name='amount'
            render={({ field }) => (
              <FormItem>
                <FormLabel>Amount (EUR)</FormLabel>
                <FormControl>
                  <Input
                    min='0'
                    step='0.01'
                    type='number'
                    {...field}
                    onChange={(event) => field.onChange(event.target.valueAsNumber)}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name='bookingDate'
            render={({ field }) => (
              <FormItem>
                <FormLabel>Booking date</FormLabel>
                <FormControl>
                  <Input type='date' {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>
        <FormField
          control={form.control}
          name='counterparty'
          render={({ field }) => (
            <FormItem>
              <FormLabel>Counterparty</FormLabel>
              <FormControl>
                <Input maxLength={200} placeholder='Supermarket' {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name='purpose'
          render={({ field }) => (
            <FormItem>
              <FormLabel>Purpose</FormLabel>
              <FormControl>
                <Input maxLength={500} placeholder='Weekly groceries' {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <div className='grid gap-4 sm:grid-cols-2'>
          <CategoryField form={form} />
          <AccountField form={form} />
        </div>
        <SwitchField
          description='The bank has reserved the amount but not booked it yet; it does not count against budgets.'
          form={form}
          label='Pending'
          name='pending'
        />
        <SwitchField
          description='Money moved between your own accounts; it never counts against budgets.'
          form={form}
          label='Transfer between own accounts'
          name='isTransfer'
        />
        <Button
          className='mt-2'
          disabled={isPending || (Boolean(initialData) && !form.formState.isDirty)}
          type='submit'
        >
          {isPending ? <SpinnerIcon className='size-5 animate-spin' /> : submitLabel}
        </Button>
      </form>
    </Form>
  );
}

function DirectionField({ form }: FormComponentProps) {
  return (
    <FormField
      control={form.control}
      name='direction'
      render={({ field }) => (
        <FormItem>
          <FormControl>
            <ToggleGroup
              className='w-full'
              type='single'
              value={field.value}
              variant='outline'
              onValueChange={(value) => value && field.onChange(value)}
            >
              <ToggleGroupItem className='flex-1' value='expense'>
                Expense or payment
              </ToggleGroupItem>
              <ToggleGroupItem className='flex-1' value='income'>
                Income or refund
              </ToggleGroupItem>
            </ToggleGroup>
          </FormControl>
        </FormItem>
      )}
    />
  );
}

function CategoryField({ form }: FormComponentProps) {
  const { data: categories } = useSuspenseQuery(categoriesQueryOptions());

  return (
    <FormField
      control={form.control}
      name='categoryId'
      render={({ field }) => (
        <FormItem>
          <FormLabel>Category</FormLabel>
          <Select value={field.value} onValueChange={field.onChange}>
            <FormControl>
              <SelectTrigger className='w-full'>
                <SelectValue />
              </SelectTrigger>
            </FormControl>
            <SelectContent>
              <SelectItem value={noneValue}>Uncategorized</SelectItem>
              {categories.map((category) => (
                <SelectItem key={category.id} value={category.id}>
                  {category.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <FormMessage />
        </FormItem>
      )}
    />
  );
}

function AccountField({ form }: FormComponentProps) {
  const { data: accounts } = useSuspenseQuery(accountsQueryOptions());

  return (
    <FormField
      control={form.control}
      name='accountId'
      render={({ field }) => (
        <FormItem>
          <FormLabel>Account</FormLabel>
          <Select value={field.value} onValueChange={field.onChange}>
            <FormControl>
              <SelectTrigger className='w-full'>
                <SelectValue />
              </SelectTrigger>
            </FormControl>
            <SelectContent>
              <SelectItem value={noneValue}>No account</SelectItem>
              {accounts.map((account) => (
                <SelectItem key={account.id} value={account.id}>
                  {account.name}
                  {account.ibanLast4 ? ` (…${account.ibanLast4})` : ''}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <FormMessage />
        </FormItem>
      )}
    />
  );
}

function SwitchField({
  description,
  form,
  label,
  name,
}: FormComponentProps & { description: string; label: string; name: 'isTransfer' | 'pending' }) {
  return (
    <FormField
      control={form.control}
      name={name}
      render={({ field }) => (
        <FormSwitchItem
          checked={field.value}
          description={description}
          label={label}
          onCheckedChange={field.onChange}
        />
      )}
    />
  );
}
