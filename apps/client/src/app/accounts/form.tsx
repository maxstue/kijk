import { zodResolver } from '@hookform/resolvers/zod';
import { Button } from '@kijk/ui/components/button';
import { SpinnerIcon } from '@kijk/ui/components/icons';
import { Input } from '@kijk/ui/components/input';
import { useForm } from 'react-hook-form';
import { toast } from 'sonner';

import { accountSchema } from '@/app/accounts/schemas';
import type { AccountFormValues } from '@/app/accounts/schemas';
import { useCreateAccount, useUpdateAccount } from '@/app/accounts/use-mutations';
import type { Account } from '@/shared/api/accounts/types';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/shared/components/form';
import { VisibilitySelect } from '@/shared/components/visibility-select';

interface Props {
  /** Whether the member may create or keep shared accounts (finances:configure). */
  canShare: boolean;
  initialData?: Account;
  onClose: () => void;
  /** Whether to offer the visibility choice; a personal space has only private data. */
  showVisibility: boolean;
}

/** Form to create an account, or to edit `initialData` when given. */
export function AccountForm({ canShare, initialData, onClose, showVisibility }: Props) {
  const createMutation = useCreateAccount();
  const updateMutation = useUpdateAccount();
  const isPending = createMutation.isPending || updateMutation.isPending;
  const isCash = initialData?.kind === 'Cash';
  const form = useForm<AccountFormValues>({
    defaultValues: {
      ibanLast4: initialData?.ibanLast4 ?? '',
      name: initialData?.name ?? '',
      visibility: initialData?.visibility ?? (canShare ? 'Shared' : 'Private'),
    },
    resolver: zodResolver(accountSchema),
  });

  function onSubmit(values: AccountFormValues) {
    const data = { ibanLast4: values.ibanLast4 || null, name: values.name, visibility: values.visibility };
    const onError = (error: Error) => toast.error(error.name, { description: error.message });
    const onSuccess = () => {
      toast.success(initialData ? 'Account updated' : 'Account created');
      onClose();
    };

    if (initialData) {
      updateMutation.mutate({ data, id: initialData.id }, { onError, onSuccess });
      return;
    }

    createMutation.mutate(data, { onError, onSuccess });
  }

  return (
    <Form {...form}>
      <form className='flex flex-col gap-4' onSubmit={form.handleSubmit(onSubmit)} noValidate>
        <FormField
          control={form.control}
          name='name'
          render={({ field }) => (
            <FormItem>
              <FormLabel>Name</FormLabel>
              <FormControl>
                <Input maxLength={100} placeholder='Checking account' {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        {!isCash && (
          <FormField
            control={form.control}
            name='ibanLast4'
            render={({ field }) => (
              <FormItem>
                <FormLabel>Last four characters of the IBAN</FormLabel>
                <FormControl>
                  <Input maxLength={4} placeholder='1234' {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        )}
        {showVisibility && (
          <FormField
            control={form.control}
            name='visibility'
            render={({ field }) => (
              <FormItem>
                <FormLabel>Who sees the account and its transactions</FormLabel>
                <VisibilitySelect canShare={canShare} value={field.value} onChange={field.onChange} />
                <FormMessage />
              </FormItem>
            )}
          />
        )}
        <Button className='mt-6' disabled={isPending || (initialData && !form.formState.isDirty)} type='submit'>
          {isPending ? <SpinnerIcon className='size-5 animate-spin' /> : initialData ? 'Update' : 'Add'}
        </Button>
      </form>
    </Form>
  );
}
