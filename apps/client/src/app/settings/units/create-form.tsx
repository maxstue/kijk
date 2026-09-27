import { zodResolver } from '@hookform/resolvers/zod';
import { Button } from '@kijk/ui/components/button';
import { SpinnerIcon } from '@kijk/ui/components/icons';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useForm } from 'react-hook-form';
import { toast } from 'sonner';

import { queryKeys } from '@/shared/api/query-keys';
import { createUnitMutationOptions } from '@/shared/api/units/options';
import type { Unit } from '@/shared/api/units/types';
import { Form } from '@/shared/components/form';

import { UnitFormFields } from './form-fields';
import { createUnitSchema } from './schemas';
import type { CreateUnitFormValues } from './schemas';

interface Props {
  householdId?: string;
  onClose: () => void;
  systemUnits: Unit[];
}

export function UnitCreateForm({ householdId, onClose, systemUnits }: Props) {
  const queryClient = useQueryClient();
  const { isPending, mutate } = useMutation(createUnitMutationOptions());
  const form = useForm<CreateUnitFormValues>({
    defaultValues: { conversionFactor: '', name: '', referenceUnitId: '', symbol: '' },
    resolver: zodResolver(createUnitSchema),
  });

  function onSubmit(values: CreateUnitFormValues) {
    mutate(
      {
        ...values,
        conversionFactor: Number(values.conversionFactor),
        shareWithHouseholdIds: householdId ? [householdId] : [],
      },
      {
        onError: (error) => toast.error(error.message),
        onSuccess: () => {
          void queryClient.invalidateQueries({ queryKey: queryKeys.units.all });
          toast.success('Successfully created');
          onClose();
        },
      },
    );
  }

  return (
    <Form {...form}>
      <form className='flex flex-col gap-4' onSubmit={form.handleSubmit(onSubmit)} noValidate>
        <UnitFormFields control={form.control} systemUnits={systemUnits} />
        <Button className='mt-6' disabled={isPending} type='submit'>
          {isPending ? <SpinnerIcon className='size-5 animate-spin' /> : 'Add'}
        </Button>
      </form>
    </Form>
  );
}
