import { zodResolver } from '@hookform/resolvers/zod';
import { Button } from '@kijk/ui/components/button';
import { Icons } from '@kijk/ui/components/icons';
import { getRouteApi } from '@tanstack/react-router';
import { Suspense } from 'react';
import { ErrorBoundary } from 'react-error-boundary';
import { useForm } from 'react-hook-form';
import { toast } from 'sonner';

import {
  ConsumptionDateField,
  ConsumptionNameField,
  ConsumptionResourceField,
  ConsumptionValueField,
  ConsumptionValueTypeField,
} from '@/app/consumptions/form-fields';
import type { ConsumptionCreateFormSchema } from '@/app/consumptions/schemas';
import { consumptionCreateSchema } from '@/app/consumptions/schemas';
import { useCreateConsumption } from '@/app/consumptions/use-create-consumption';
import { Form, FormField } from '@/shared/components/form';
import { Loader } from '@/shared/components/ui/loaders/loader';
import { ValueTypes } from '@/shared/types/domain';
import { getMonthIndexFromString } from '@/shared/utils/months';

const route = getRouteApi('/_protected/consumptions');

interface Props {
  onClose: () => void;
}

export function ConsumptionCreateForm({ onClose }: Props) {
  const { isPending, mutate } = useCreateConsumption();
  const { month, year } = route.useSearch();

  const creationDate = new Date(`${Number(year)}-${getMonthIndexFromString(month)}-${new Date().getDate()}`);

  const form = useForm({
    defaultValues: {
      date: creationDate,
      name: '',
      resourceId: undefined,
      value: 0,
      valueType: ValueTypes.ABSOLUTE,
    },
    resolver: zodResolver(consumptionCreateSchema),
  });

  const handleError = () => toast('Error updating');

  function onSubmit(data: ConsumptionCreateFormSchema) {
    mutate(data, {
      onError(error) {
        toast.error(error.name, { description: error.message });
      },
      onSuccess() {
        toast.success('Successfully created');
        onClose();
      },
    });
  }

  return (
    <Suspense fallback={<Loader />}>
      <Form {...form}>
        <form className='flex flex-col gap-4 px-2' onSubmit={form.handleSubmit(onSubmit, handleError)} noValidate>
          <FormField control={form.control} name='name' render={(props) => <ConsumptionNameField {...props} />} />
          <ErrorBoundary fallback={<div className='text-destructive-foreground'>Error loading resources</div>}>
            <div>
              <FormField control={form.control} name='value' render={(props) => <ConsumptionValueField {...props} />} />
              <FormField
                control={form.control}
                name='valueType'
                render={(props) => <ConsumptionValueTypeField {...props} />}
              />
              <Suspense fallback={<Loader className='size-6' />}>
                <FormField
                  control={form.control}
                  name='resourceId'
                  render={(props) => <ConsumptionResourceField {...props} />}
                />
              </Suspense>
            </div>
          </ErrorBoundary>
          <FormField control={form.control} name='date' render={(props) => <ConsumptionDateField {...props} />} />
          <Button className='mt-6' disabled={isPending} type='submit'>
            {isPending ? <Icons.spinner className='size-5 animate-spin' /> : 'Add'}
          </Button>
        </form>
      </Form>
    </Suspense>
  );
}
