import { zodResolver } from '@hookform/resolvers/zod';
import * as transactionsOptions from '@kijk/api/transactions/options';
import type { Transaction } from '@kijk/api/transactions/types';
import { Button } from '@kijk/ui/components/button';
import { SpinnerIcon } from '@kijk/ui/components/icons';
import { useMutation } from '@tanstack/react-query';
import { useForm } from 'react-hook-form';
import { toast } from 'sonner';

import { getCreateDefaultValues, toFormValues, toRequest } from '@/app/transactions/helpers';
import type { TransactionFormValues } from '@/app/transactions/schemas';
import { transactionSchema } from '@/app/transactions/schemas';
import { Form } from '@/shared/components/form';
import { useSpaceId } from '@/shared/hooks/use-active-space';

import {
  DirectionField,
  CategoryField,
  AccountField,
  SwitchField,
  AmountField,
  BookingDateField,
  CounterpartyField,
  PurposeField,
} from './form-fields';

interface Props {
  initialData?: Transaction;
  onClose: () => void;
}

/** Form to record a transaction, or to edit `initialData` when given. */
export function TransactionForm({ initialData, onClose }: Props) {
  const spaceId = useSpaceId();
  const createMutation = useMutation(transactionsOptions.recordMutationOptions(spaceId));
  const updateMutation = useMutation(transactionsOptions.updateMutationOptions(spaceId));
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
        <DirectionField />
        <div className='grid gap-4 sm:grid-cols-2'>
          <AmountField />
          <BookingDateField />
        </div>
        <CounterpartyField />
        <PurposeField />
        <div className='grid gap-4 sm:grid-cols-2'>
          <CategoryField />
          <AccountField />
        </div>
        <SwitchField
          description='The bank has reserved the amount but not booked it yet; it does not count against budgets.'

          label='Pending'
          name='pending'
        />
        <SwitchField
          description='Money moved between your own accounts; it never counts against budgets.'

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
