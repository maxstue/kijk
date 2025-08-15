import { Suspense, useCallback } from 'react';
import { toast } from 'sonner';
import { useWatch } from 'react-hook-form';
import { ErrorBoundary } from 'react-error-boundary';
import type { PropsWithChildren } from 'react';

import type { ControllerRenderProps, SubmitErrorHandler, SubmitHandler, UseFormReturn } from 'react-hook-form';
import type { ConsumptionCreateFormSchema } from '@/app/consumptions/schemas';
import type { Months } from '@/shared/types/app';
import { ConsumptionCreateSchema } from '@/app/consumptions/schemas';
import { useCreateConsumption } from '@/app/consumptions/use-create-consumption.ts';
import { Icons } from '@/shared/components/icons';
import { Button } from '@/shared/components/ui/button';
import { useZodForm } from '@/shared/components/ui/form/use-zod-form';
import { getMonthIndexFromString } from '@/shared/utils/format';
import { AsyncLoader } from '@/shared/components/ui/loaders/async-loader';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/shared/components/ui/form/form';
import { Input } from '@/shared/components/ui/input';
import ResourceUnit from '@/app/consumptions/resources-unit';
import { useGetResources } from '@/app/resources/use-get-resources';
import { DatePicker } from '@/shared/components/date-picker';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/shared/components/ui/select';

interface TProps {
  year: number;
  month: Months;
  onClose: () => void;
}

export function ConsumptionCreateForm({ onClose, ...props }: TProps) {
  const { isPending, mutate } = useCreateConsumption();

  const year = 'year' in props ? props.year : new Date().getFullYear();
  const month = 'month' in props ? props.month : (new Date().toLocaleString('default', { month: 'long' }) as Months);

  const creationDate = new Date(`${Number(year)}-${getMonthIndexFromString(month)}-${new Date().getDate()}`);

  const form = useZodForm({
    schema: ConsumptionCreateSchema,
    defaultValues: {
      name: '',
      value: 0,
      resourceId: undefined,
      date: creationDate,
    },
    mode: 'onBlur',
  });

  const handleError = useCallback(() => {
    toast('Error updating');
  }, []);

  function onSubmit(data: ConsumptionCreateFormSchema) {
    mutate(
      { newEnergy: { ...data } },
      {
        onError(error) {
          toast.error(error.name, { description: error.message });
        },
        onSuccess() {
          toast.success('Successfully created');
          onClose();
        },
      },
    );
  }

  return (
    <Suspense fallback={<AsyncLoader />}>
      <ConsumptionForm form={form} onInvalid={handleError} onSubmit={onSubmit}>
        <Button className='mt-6' disabled={isPending} type='submit'>
          {isPending ? <Icons.spinner className='h-5 w-5 animate-spin' /> : 'Add'}
        </Button>
      </ConsumptionForm>
    </Suspense>
  );
}

interface FormProps extends PropsWithChildren {
  form: UseFormReturn<ConsumptionCreateFormSchema>;
  onSubmit: SubmitHandler<ConsumptionCreateFormSchema>;
  onInvalid?: SubmitErrorHandler<ConsumptionCreateFormSchema>;
}

function ConsumptionForm({ form, onSubmit, onInvalid, children }: FormProps) {
  return (
    <Form className='flex flex-col gap-4 px-2' form={form} onInvalid={onInvalid} onSubmit={onSubmit}>
      <FormField control={form.control} name='name' render={NameField} />
      <ErrorBoundary fallback={<div className='text-destructive-foreground'>Error loading resources</div>}>
        <FormField control={form.control} name='value' render={ValueField} />
        <Suspense fallback={<AsyncLoader className='h-6 w-6' />}>
          <FormField control={form.control} name='resourceId' render={ResourceField} />
        </Suspense>
      </ErrorBoundary>
      <FormField control={form.control} name='date' render={DateField} />
      {children}
    </Form>
  );
}

function NameField({ field }: { field: ControllerRenderProps<ConsumptionCreateFormSchema, 'name'> }) {
  return (
    <FormItem>
      <FormLabel>Name</FormLabel>
      <FormControl>
        <Input placeholder='Name' {...field} />
      </FormControl>
      <FormMessage />
    </FormItem>
  );
}

function ValueField({ field }: { field: ControllerRenderProps<ConsumptionCreateFormSchema, 'value'> }) {
  const type = useWatch<ConsumptionCreateFormSchema, 'resourceId'>({ name: 'resourceId' });
  const { data } = useGetResources();
  const resource = data.find((item) => item.id === type);

  return (
    <FormItem>
      <FormLabel>
        Amount (<ResourceUnit type={resource} />)
      </FormLabel>
      <FormControl>
        <Input placeholder='Value in kWh' type='number' {...field} onChange={field.onChange} />
      </FormControl>
      <FormMessage />
    </FormItem>
  );
}

function ResourceField({ field }: { field: ControllerRenderProps<ConsumptionCreateFormSchema, 'resourceId'> }) {
  const { data } = useGetResources();
  return (
    <FormItem>
      <FormLabel>Resource</FormLabel>
      <Select defaultValue={field.value} onValueChange={field.onChange}>
        <FormControl>
          <SelectTrigger>
            <SelectValue placeholder='Select an energy type' />
          </SelectTrigger>
        </FormControl>
        <SelectContent>
          {data.map((item) => (
            <SelectItem key={item.id} value={item.id}>
              <div className='flex items-center gap-2'>
                {item.name}
                <span className='text-muted-foreground text-xs'>({item.unit})</span>
              </div>
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
      <FormMessage />
    </FormItem>
  );
}

function DateField({ field }: { field: ControllerRenderProps<ConsumptionCreateFormSchema, 'date'> }) {
  return (
    <FormItem>
      <FormLabel>Date</FormLabel>
      <FormControl>
        <DatePicker date={field.value} setDate={field.onChange} {...field} />
      </FormControl>
      <FormMessage />
    </FormItem>
  );
}
