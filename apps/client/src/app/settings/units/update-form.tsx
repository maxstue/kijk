import { zodResolver } from '@hookform/resolvers/zod';
import * as unitsOptions from '@kijk/api/units/options';
import type { Unit } from '@kijk/api/units/types';
import { Button } from '@kijk/ui/components/button';
import { SpinnerIcon } from '@kijk/ui/components/icons';
import { useMutation } from '@tanstack/react-query';
import { useForm } from 'react-hook-form';
import { toast } from 'sonner';

import { Form } from '@/shared/components/form';

import { UnitFormFields } from './form-fields';
import { updateUnitSchema } from './schemas';
import type { UpdateUnitFormValues } from './schemas';

interface Props {
  onClose: () => void;
  unit: Unit;
}

/** Form to edit a unit owned by the user. */
export function UnitUpdateForm({ onClose, unit }: Props) {
  const { isPending, mutate } = useMutation(unitsOptions.updateMutationOptions());
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
          toast.success(unit.conversionType === 'None' ? 'Legacy unit converted' : 'Successfully updated');
          onClose();
        },
      },
    );
  }

  const submitLabel = unit.conversionType === 'None' ? 'Convert' : 'Update';

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
        <UnitFormFields control={form.control} />
        <Button className='mt-6' disabled={isPending || !form.formState.isDirty} type='submit'>
          {isPending ? <SpinnerIcon className='size-5 animate-spin' /> : submitLabel}
        </Button>
      </form>
    </Form>
  );
}
