import { useCallback } from 'react';

import { TransactionFormValues, transactionSchema } from '@/app/budget/schemas';
import { TransactionForm } from '@/app/budget/transaction-form';
import { useCreateTransaction } from '@/app/budget/use-create-transaction';
import { Icons } from '@/shared/components/icons';
import { Button } from '@/shared/components/ui/button';
import { useZodForm } from '@/shared/components/ui/form/use-zod-form';
import { useToast } from '@/shared/hooks/use-toast';
import { Months } from '@/shared/types/app';
import { getMonthIndexFromString } from '@/shared/utils/format';

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
  const { isPending, mutate } = useCreateTransaction();
  const { toast } = useToast();

  const year = 'year' in props ? props.year : new Date().getFullYear();
  const month = 'month' in props ? props.month : (new Date().toLocaleString('default', { month: 'long' }) as Months);

  const creationDate = fromCmd
    ? new Date()
    : new Date(`${Number(year)}-${getMonthIndexFromString(month)}-${new Date().getDate()}`);

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

  const handleError = useCallback(() => {
    toast({
      title: `Error updating`,
      variant: 'destructive',
    });
  }, [toast]);

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
    <TransactionForm form={form} onSubmit={onSubmit} onInvalid={handleError}>
      <Button type='submit' disabled={isPending}>
        {isPending ? <Icons.spinner className='h-5 w-5 animate-spin' /> : 'Add'}
      </Button>
    </TransactionForm>
  );
}
