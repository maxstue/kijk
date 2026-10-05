import { zodResolver } from '@hookform/resolvers/zod';
import { Button } from '@kijk/ui/components/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@kijk/ui/components/dialog';
import { Input } from '@kijk/ui/components/input';
import { Separator } from '@kijk/ui/components/separator';
import { useSuspenseQuery } from '@tanstack/react-query';
import { Landmark, Trash2 } from 'lucide-react';
import { useForm } from 'react-hook-form';
import { toast } from 'sonner';

import { accountSchema } from '@/app/transactions/schemas';
import type { AccountFormValues } from '@/app/transactions/schemas';
import { useCreateAccount, useDeleteAccount } from '@/app/transactions/use-account-mutations';
import { accountsQueryOptions } from '@/shared/api/accounts/options';
import { HouseholdPermissions } from '@/shared/api/households/permissions';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/shared/components/form';
import { useHouseholdPermission } from '@/shared/hooks/use-household-permission';

/** Dialog listing the household's bank accounts, with creating and deleting accounts. */
export function AccountsDialog() {
  const canConfigure = useHouseholdPermission(HouseholdPermissions.finances.configure);
  const { data: accounts } = useSuspenseQuery(accountsQueryOptions());
  const deleteMutation = useDeleteAccount();

  function onDelete(id: string) {
    deleteMutation.mutate(id, {
      onError: (error) => toast.error(error.name, { description: error.message }),
      onSuccess: () => toast.success('Account deleted'),
    });
  }

  return (
    <Dialog>
      <DialogTrigger asChild>
        <Button variant='outline'>
          <Landmark /> Accounts
        </Button>
      </DialogTrigger>
      <DialogContent className='max-h-[calc(100vh-2rem)] overflow-y-auto sm:max-w-lg'>
        <DialogHeader>
          <DialogTitle>Accounts</DialogTitle>
          <DialogDescription>Kijk only stores the last four characters of an IBAN.</DialogDescription>
        </DialogHeader>
        {accounts.length === 0 ? (
          <p className='text-muted-foreground text-sm'>No accounts yet.</p>
        ) : (
          <ul className='divide-y'>
            {accounts.map((account) => (
              <li key={account.id} className='flex items-center justify-between gap-3 py-2'>
                <span>
                  {account.name}
                  {account.ibanLast4 && <span className='text-muted-foreground'> …{account.ibanLast4}</span>}
                </span>
                {account.kind === 'Cash' ? (
                  <span className='text-muted-foreground text-xs'>For manual transactions; never imported</span>
                ) : (
                  <Button
                    aria-label={`Delete ${account.name}`}
                    disabled={!canConfigure || deleteMutation.isPending}
                    size='icon-sm'
                    variant='ghost'
                    onClick={() => onDelete(account.id)}
                  >
                    <Trash2 />
                  </Button>
                )}
              </li>
            ))}
          </ul>
        )}
        {canConfigure && (
          <>
            <Separator />
            <CreateAccountForm />
          </>
        )}
      </DialogContent>
    </Dialog>
  );
}

function CreateAccountForm() {
  const createMutation = useCreateAccount();
  const form = useForm<AccountFormValues>({
    defaultValues: { ibanLast4: '', name: '' },
    resolver: zodResolver(accountSchema),
  });

  function onSubmit(values: AccountFormValues) {
    createMutation.mutate(
      { ibanLast4: values.ibanLast4 || null, name: values.name },
      {
        onError: (error) => toast.error(error.name, { description: error.message }),
        onSuccess: () => {
          toast.success('Account created');
          form.reset();
        },
      },
    );
  }

  return (
    <Form {...form}>
      <form
        className='grid gap-3 sm:grid-cols-[1fr_7rem_auto] sm:items-end'
        onSubmit={form.handleSubmit(onSubmit)}
        noValidate
      >
        <FormField
          control={form.control}
          name='name'
          render={({ field }) => (
            <FormItem>
              <FormLabel>New account</FormLabel>
              <FormControl>
                <Input maxLength={100} placeholder='Checking account' {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name='ibanLast4'
          render={({ field }) => (
            <FormItem>
              <FormLabel>IBAN end</FormLabel>
              <FormControl>
                <Input maxLength={4} placeholder='1234' {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <Button disabled={createMutation.isPending} type='submit'>
          Add
        </Button>
      </form>
    </Form>
  );
}
