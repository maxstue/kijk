import { useForm, useWatch } from 'react-hook-form';
import { Suspense, useCallback } from 'react';
import { ErrorBoundary } from 'react-error-boundary';
import { toast } from 'sonner';
import type { PropsWithChildren } from 'react';
import type { ControllerRenderProps, SubmitErrorHandler, SubmitHandler, UseFormReturn } from 'react-hook-form';

import type { ConsumptionUpdateFormSchema } from '@/app/consumptions/schemas';
import type { Consumption } from '@/shared/types/app';
import { ConsumptionUpdateSchema } from '@/app/consumptions/schemas';
import ResourceUnit from '@/app/consumptions/resources-unit.tsx';
import { DatePicker } from '@/shared/components/date-picker';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/shared/components/ui/form';
import { Input } from '@/shared/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/shared/components/ui/select';
import { useGetResources } from '@/app/resources/use-get-resources';
import { AsyncLoader } from '@/shared/components/ui/loaders/async-loader';
import { useUpdateConsumption } from '@/app/consumptions/use-update-consumption';
import { Button } from '@/shared/components/ui/button';
import { Icons } from '@/shared/components/icons';
import { zodResolver } from '@hookform/resolvers/zod';

interface Props {
  initialData: Consumption;
  onClose: () => void;
}

export function ConsumptionUpdateForm({ onClose, initialData }: Props) {
  const { isPending, mutate } = useUpdateConsumption();

  const form = useForm({
    resolver: zodResolver(ConsumptionUpdateSchema),
    defaultValues: {
      ...initialData,
      resourceId: initialData.resource.id,
      date: initialData.date ? new Date(initialData.date) : new Date(),
    },
    mode: 'onBlur',
  });

  const handleError = useCallback(() => {
    toast('Error updating');
  }, []);

  function onSubmit(data: ConsumptionUpdateFormSchema) {
    mutate(
      { id: data.id, consumption: data },
      {
        onError(error) {
          toast.error(error.name, { description: error.message });
        },
        onSuccess() {
          toast.success('Successfully updated');
          onClose();
        },
      },
    );
  }

  return (
    <ConsumptionForm form={form} onInvalid={handleError} onSubmit={onSubmit}>
      <Button className='mt-6' disabled={isPending} type='submit'>
        {isPending ? <Icons.spinner className='h-5 w-5 animate-spin' /> : 'Update'}
      </Button>
    </ConsumptionForm>
  );
}

interface FormProps extends PropsWithChildren {
  form: UseFormReturn<ConsumptionUpdateFormSchema>;
  onSubmit: SubmitHandler<ConsumptionUpdateFormSchema>;
  onInvalid?: SubmitErrorHandler<ConsumptionUpdateFormSchema>;
}

function ConsumptionForm({ form, onSubmit, onInvalid, children }: FormProps) {
  return (
    <Form {...form}>
      <form className='flex flex-col gap-4 px-2' onSubmit={form.handleSubmit(onSubmit, onInvalid)}>
        <FormField control={form.control} name='name' render={NameField} />
        <ErrorBoundary fallback={<div className='text-destructive-foreground'>Error loading resources</div>}>
          <FormField control={form.control} name='value' render={ValueField} />
          <Suspense fallback={<AsyncLoader className='h-6 w-6' />}>
            <FormField control={form.control} name='resourceId' render={ResourceField} />
          </Suspense>
        </ErrorBoundary>
        <FormField control={form.control} name='date' render={DateField} />
        {children}
      </form>
    </Form>
  );
}

function NameField({ field }: { field: ControllerRenderProps<ConsumptionUpdateFormSchema, 'name'> }) {
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

function ValueField({ field }: { field: ControllerRenderProps<ConsumptionUpdateFormSchema, 'value'> }) {
  const type = useWatch<ConsumptionUpdateFormSchema, 'resourceId'>({ name: 'resourceId' });
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

function ResourceField({ field }: { field: ControllerRenderProps<ConsumptionUpdateFormSchema, 'resourceId'> }) {
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

function DateField({ field }: { field: ControllerRenderProps<ConsumptionUpdateFormSchema, 'date'> }) {
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
