import { zodResolver } from '@hookform/resolvers/zod';
import { accountsQueryOptions } from '@kijk/api/accounts/options';
import { categoriesQueryOptions } from '@kijk/api/categories/options';
import { createTransactionMutationOptions, updateTransactionMutationOptions } from '@kijk/api/transactions/options';
import type { Transaction } from '@kijk/api/transactions/types';
import { Button } from '@kijk/ui/components/button';
import { SpinnerIcon } from '@kijk/ui/components/icons';
import { Input } from '@kijk/ui/components/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@kijk/ui/components/select';
import { ToggleGroup, ToggleGroupItem } from '@kijk/ui/components/toggle-group';
import { useMutation, useSuspenseQuery } from '@tanstack/react-query';
import { useForm } from 'react-hook-form';
import type { UseFormReturn } from 'react-hook-form';
import { toast } from 'sonner';

import { getCreateDefaultValues, toFormValues, toRequest } from '@/app/transactions/helpers';
import { noneValue, transactionSchema } from '@/app/transactions/schemas';
import type { TransactionFormValues } from '@/app/transactions/schemas';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/shared/components/form';
import { FormSwitchItem } from '@/shared/components/form-switch-item';
import { useSpaceId } from '@/shared/hooks/use-active-space';
import { accountLabel } from '@/shared/utils/format';

interface Props {
  initialData?: Transaction;
  onClose: () => void;
}

interface FormComponentProps {
  form: UseFormReturn<TransactionFormValues>;
}

/** Form to record a transaction, or to edit `initialData` when given. */
export function TransactionForm({ initialData, onClose }: Props) {
  const spaceId = useSpaceId();
  const createMutation = useMutation(createTransactionMutationOptions(spaceId));
  const updateMutation = useMutation(updateTransactionMutationOptions(spaceId));
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
              value={[field.value]}
              variant='outline'
              onValueChange={(values) => values[0] && field.onChange(values[0])}
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
  const spaceId = useSpaceId();
  const { data: categories } = useSuspenseQuery(categoriesQueryOptions(spaceId));

  return (
    <FormField
      control={form.control}
      name='categoryId'
      render={({ field }) => (
        <FormItem>
          <FormLabel>Category</FormLabel>
          <Select
            items={[
              { label: 'Uncategorized', value: noneValue },
              ...categories.map((category) => ({ label: category.name, value: category.id })),
            ]}
            value={field.value}
            onValueChange={field.onChange}
          >
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
  const spaceId = useSpaceId();
  const { data: accounts } = useSuspenseQuery(accountsQueryOptions(spaceId));

  return (
    <FormField
      control={form.control}
      name='accountId'
      render={({ field }) => (
        <FormItem>
          <FormLabel>Account</FormLabel>
          <Select
            items={[
              { label: 'No account', value: noneValue },
              ...accounts.map((account) => ({ label: accountLabel(account), value: account.id })),
            ]}
            value={field.value}
            onValueChange={field.onChange}
          >
            <FormControl>
              <SelectTrigger className='w-full'>
                <SelectValue />
              </SelectTrigger>
            </FormControl>
            <SelectContent>
              <SelectItem value={noneValue}>No account</SelectItem>
              {accounts.map((account) => (
                <SelectItem key={account.id} value={account.id}>
                  {accountLabel(account)}
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
