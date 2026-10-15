import { zodResolver } from '@hookform/resolvers/zod';
import { createUnitMutationOptions } from '@kijk/api/units/options';
import { Button } from '@kijk/ui/components/button';
import { SpinnerIcon } from '@kijk/ui/components/icons';
import { useMutation } from '@tanstack/react-query';
import { useForm } from 'react-hook-form';
import { toast } from 'sonner';

import { Form } from '@/shared/components/form';

import { UnitFormFields } from './form-fields';
import { createUnitSchema } from './schemas';
import type { CreateUnitFormValues } from './schemas';

interface Props {
  spaceId?: string;
  onClose: () => void;
}

/** Form to create a unit; it is shared with `spaceId` when given. */
export function UnitCreateForm({ spaceId, onClose }: Props) {
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
        shareWithSpaceIds: spaceId ? [spaceId] : [],
      },
      {
        onError: (error) => toast.error(error.message),
        onSuccess: () => {
          toast.success('Successfully created');
          onClose();
        },
      },
    );
  }

  return (
    <Form {...form}>
      <form className='flex flex-col gap-4' onSubmit={form.handleSubmit(onSubmit)} noValidate>
        <UnitFormFields control={form.control} />
        <Button className='mt-6' disabled={isPending} type='submit'>
          {isPending ? <SpinnerIcon className='size-5 animate-spin' /> : 'Add'}
        </Button>
      </form>
    </Form>
  );
}
