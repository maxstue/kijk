import { useForm, useWatch } from 'react-hook-form';
import { Suspense } from 'react';
import { ErrorBoundary } from 'react-error-boundary';
import { toast } from 'sonner';
import type { ControllerRenderProps } from 'react-hook-form';

import type { ConsumptionUpdateFormSchema } from '@/app/consumptions/schemas';
import { ValueTypes, type Consumption } from '@/shared/types/app';
import { consumptionUpdateSchema } from '@/app/consumptions/schemas';
import { ResourceUnit } from '@/app/consumptions/resources-unit.tsx';
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
import { Checkbox } from '@/shared/components/ui/checkbox';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/shared/components/ui/tooltip';
import { InfoIcon } from 'lucide-react';

interface Props {
  initialData: Consumption;
  onClose: () => void;
}

export function ConsumptionUpdateForm({ onClose, initialData }: Props) {
  const { isPending, mutate } = useUpdateConsumption();

  const form = useForm({
    resolver: zodResolver(consumptionUpdateSchema),
    defaultValues: {
      ...initialData,
      valueType: ValueTypes.ABSOLUTE,
      resourceId: initialData.resource.id,
      date: initialData.date ? new Date(initialData.date) : new Date(),
    },
  });

  const handleError = () => toast('Error updating');

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
    <Form {...form}>
      <form className='flex flex-col gap-4 px-2' onSubmit={form.handleSubmit(onSubmit, handleError)}>
        <FormField control={form.control} name='name' render={NameField} />
        <ErrorBoundary fallback={<div className='text-destructive-foreground'>Error loading resources</div>}>
          <FormField control={form.control} name='value' render={ValueField} />
          <FormField control={form.control} name='valueType' render={ValueTypeField} />
          <Suspense fallback={<AsyncLoader className='h-6 w-6' />}>
            <FormField control={form.control} name='resourceId' render={ResourceField} />
          </Suspense>
        </ErrorBoundary>
        <FormField control={form.control} name='date' render={DateField} />
        <Button className='mt-6' disabled={isPending} type='submit'>
          {isPending ? <Icons.spinner className='h-5 w-5 animate-spin' /> : 'Update'}
        </Button>
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
      <FormLabel className='flex gap-2'>
        Amount
        <div className='flex'>
          (<ResourceUnit type={resource} />)
        </div>
      </FormLabel>
      <FormControl>
        <Input
          placeholder='Value in kWh'
          type='number'
          {...field}
          onChange={(event) => field.onChange(event.target.valueAsNumber)}
        />
      </FormControl>
      <FormMessage />
    </FormItem>
  );
}

function ValueTypeField({ field }: { field: ControllerRenderProps<ConsumptionUpdateFormSchema, 'valueType'> }) {
  return (
    <FormItem>
      <FormLabel className='flex items-center gap-2'>
        Value Type
        <Tooltip>
          <TooltipTrigger asChild>
            <InfoIcon className='text-muted-foreground hover:text-muted h-4 w-4' />
          </TooltipTrigger>
          <TooltipContent>
            <p className='text-sm'>Toggle between absolute and relative value types.</p>
          </TooltipContent>
        </Tooltip>
      </FormLabel>

      <FormControl className='flex items-center gap-2'>
        <div className='flex items-center gap-2'>
          <Checkbox
            checked={field.value == ValueTypes.ABSOLUTE}
            onCheckedChange={(checked) => field.onChange(checked ? 'Absolute' : 'Relative')}
          />
          <div className='select-none'>{field.value}</div>
        </div>
      </FormControl>
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
