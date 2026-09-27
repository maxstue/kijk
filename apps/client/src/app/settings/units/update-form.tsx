import { zodResolver } from '@hookform/resolvers/zod';
import { Button } from '@kijk/ui/components/button';
import { SpinnerIcon } from '@kijk/ui/components/icons';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useForm } from 'react-hook-form';
import { toast } from 'sonner';

import { queryKeys } from '@/shared/api/query-keys';
import { updateUnitMutationOptions } from '@/shared/api/units/options';
import type { Unit } from '@/shared/api/units/types';
import { Form } from '@/shared/components/form';

import { UnitFormFields } from './form-fields';
import { updateUnitSchema } from './schemas';
import type { UpdateUnitFormValues } from './schemas';

interface Props {
  onClose: () => void;
  systemUnits: Unit[];
  unit: Unit;
}

export function UnitUpdateForm({ onClose, systemUnits, unit }: Props) {
  const queryClient = useQueryClient();
  const { isPending, mutate } = useMutation(updateUnitMutationOptions());
  const form = useForm<UpdateUnitFormValues>({
    defaultValues: {
      conversionFactor: unit.conversionFactor == null ? '' : String(unit.conversionFactor),
      name: unit.name,
      referenceUnitId: unit.referenceUnitId ?? '',
      symbol: unit.symbol,
    },
    resolver: zodResolver(updateUnitSchema),
  });

  function onSubmit(values: UpdateUnitFormValues) {
    mutate(
      { data: { ...values, conversionFactor: Number(values.conversionFactor) }, id: unit.id },
      {
        onError: (error) => toast.error(error.message),
        onSuccess: () => {
          void queryClient.invalidateQueries({ queryKey: queryKeys.units.all });
          void queryClient.invalidateQueries({ queryKey: queryKeys.resources.all });
          void queryClient.invalidateQueries({ queryKey: queryKeys.consumptions.all });
          toast.success(unit.conversionType === 'None' ? 'Legacy unit converted' : 'Successfully updated');
          onClose();
        },
      },
    );
  }

  return (
    <Form {...form}>
      <form className='flex flex-col gap-4' onSubmit={form.handleSubmit(onSubmit)} noValidate>
        {unit.conversionType === 'None' && (
          <p className='text-muted-foreground text-sm'>
            This legacy unit has no conversion rule. Choose what its existing values mean; stored numbers will not
            change.
          </p>
        )}
        {unit.conversionType !== 'None' && Number(unit.resourceCount) > 0 && (
          <p className='text-muted-foreground text-sm'>
            Changing the reference unit or factor also changes how existing values are interpreted.
          </p>
        )}
        <UnitFormFields control={form.control} systemUnits={systemUnits} />
        <Button className='mt-6' disabled={isPending || !form.formState.isDirty} type='submit'>
          {isPending ? (
            <SpinnerIcon className='size-5 animate-spin' />
          ) : unit.conversionType === 'None' ? (
            'Convert'
          ) : (
            'Update'
          )}
        </Button>
      </form>
    </Form>
  );
}
