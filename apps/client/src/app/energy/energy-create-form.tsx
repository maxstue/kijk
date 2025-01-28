import { useCallback } from 'react';

import { EnergyForm } from '@/app/energy/energy-form';
import { EnergyFormSchema, energySchema } from '@/app/energy/schemas';
import { useCreateEnergy } from '@/app/energy/use-create-energy';
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

export function EnergyCreateForm({ fromCmd, onClose, ...props }: TProps) {
  const { isPending, mutate } = useCreateEnergy();
  const { toast } = useToast();

  const year = 'year' in props ? props.year : new Date().getFullYear();
  const month = 'month' in props ? props.month : (new Date().toLocaleString('default', { month: 'long' }) as Months);

  const creationDate = fromCmd
    ? new Date()
    : new Date(`${Number(year)}-${getMonthIndexFromString(month)}-${new Date().getDate()}`);

  const form = useZodForm({
    schema: energySchema,
    defaultValues: {
      name: '',
      value: 0,
      type: 'Electricity',
      date: creationDate,
    },
    mode: 'onBlur',
  });

  const handleError = useCallback(() => {
    toast({
      title: `Error updating`,
      variant: 'destructive',
    });
  }, [toast]);

  function onSubmit(data: EnergyFormSchema) {
    mutate(
      { newEnergy: { ...data } },
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
    <EnergyForm form={form} onInvalid={handleError} onSubmit={onSubmit}>
      <Button disabled={isPending} type='submit'>
        {isPending ? <Icons.spinner className='h-5 w-5 animate-spin' /> : 'Add'}
      </Button>
    </EnergyForm>
  );
}
