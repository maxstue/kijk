import { zodResolver } from '@hookform/resolvers/zod';
import { Button } from '@kijk/ui/components/button';
import { Icons } from '@kijk/ui/components/icons';
import { Input } from '@kijk/ui/components/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@kijk/ui/components/select';
import { Switch } from '@kijk/ui/components/switch';
import { Textarea } from '@kijk/ui/components/textarea';
import { useSuspenseQuery } from '@tanstack/react-query';
import { useForm } from 'react-hook-form';
import type { ControllerRenderProps, UseFormReturn } from 'react-hook-form';
import { toast } from 'sonner';

import { consumptionLimitSchema, periods } from '@/app/consumption-limits/schemas';
import type { ConsumptionLimitFormValues } from '@/app/consumption-limits/schemas';
import { useCreateConsumptionLimit } from '@/app/consumption-limits/use-create-limit';
import { useUpdateConsumptionLimit } from '@/app/consumption-limits/use-update-limit';
import type { ConsumptionLimit } from '@/shared/api/consumption-limits/types';
import { resourcesQueryOptions } from '@/shared/api/resources/options';
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/shared/components/form';
import type { Resource } from '@/shared/types/domain';

interface Props {
  initialData?: ConsumptionLimit;
  onClose: () => void;
}

const createDefaultValues: ConsumptionLimitFormValues = {
  active: true,
  description: '',
  limit: 0,
  name: '',
  period: 'Month',
  resourceId: '',
};

export function ConsumptionLimitForm({ initialData, onClose }: Props) {
  const createMutation = useCreateConsumptionLimit();
  const updateMutation = useUpdateConsumptionLimit();
  const { data: resources } = useSuspenseQuery(resourcesQueryOptions());
  const isPending = createMutation.isPending || updateMutation.isPending;
  const form = useForm<ConsumptionLimitFormValues>({
    defaultValues: initialData ? getUpdateDefaultValues(initialData) : createDefaultValues,
    resolver: zodResolver(consumptionLimitSchema),
  });

  function onSubmit(values: ConsumptionLimitFormValues) {
    const onError = (error: Error) => toast.error(error.name, { description: error.message });
    const onSuccess = () => {
      toast.success(initialData ? 'Limit updated' : 'Limit created');
      onClose();
    };

    if (initialData) {
      const { resourceId: _, ...limit } = values;
      updateMutation.mutate({ id: initialData.id, limit }, { onError, onSuccess });
      return;
    }

    createMutation.mutate(values, { onError, onSuccess });
  }

  return (
    <Form {...form}>
      <form className='grid gap-4' onSubmit={form.handleSubmit(onSubmit)} noValidate>
        <FormField control={form.control} name='name' render={({ field }) => <NameField field={field} />} />
        <ResourceField disabled={Boolean(initialData)} form={form} resources={resources} />
        <div className='grid gap-4 sm:grid-cols-2'>
          <LimitField form={form} />
          <PeriodField form={form} />
        </div>
        <DescriptionField form={form} />
        <ActiveField form={form} />
        <SubmitButton form={form} isEditing={Boolean(initialData)} isPending={isPending} />
      </form>
    </Form>
  );
}

function getUpdateDefaultValues(initialData: ConsumptionLimit): ConsumptionLimitFormValues {
  return {
    active: initialData.active,
    description: initialData.description ?? '',
    limit: Number(initialData.limit),
    name: initialData.name,
    period: initialData.period,
    resourceId: initialData.resource.id,
  };
}

interface FormComponentProps {
  form: UseFormReturn<ConsumptionLimitFormValues>;
}

function NameField({ field }: { field: ControllerRenderProps<ConsumptionLimitFormValues, 'name'> }) {
  return (
    <FormItem>
      <FormLabel>Name</FormLabel>
      <FormControl>
        <Input maxLength={100} placeholder='Monthly electricity target' {...field} />
      </FormControl>
      <FormMessage />
    </FormItem>
  );
}

function ResourceField({
  disabled,
  form,
  resources,
}: FormComponentProps & { disabled: boolean; resources: Resource[] }) {
  return (
    <FormField
      control={form.control}
      name='resourceId'
      render={({ field }) => (
        <FormItem>
          <FormLabel>Resource</FormLabel>
          <Select disabled={disabled} value={field.value} onValueChange={field.onChange}>
            <FormControl>
              <SelectTrigger>
                <SelectValue placeholder='Select an energy type' />
              </SelectTrigger>
            </FormControl>
            <SelectContent>
              {resources.map((resource) => (
                <SelectItem key={resource.id} value={resource.id}>
                  {resource.name} ({resource.unit})
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <FormMessage />
        </FormItem>
      )}
    />
  );
}

function LimitField({ form }: FormComponentProps) {
  return (
    <FormField
      control={form.control}
      name='limit'
      render={({ field }) => (
        <FormItem>
          <FormLabel>Limit</FormLabel>
          <FormControl>
            <Input
              min='0'
              step='any'
              type='number'
              {...field}
              onChange={(event) => field.onChange(event.target.valueAsNumber)}
            />
          </FormControl>
          <FormMessage />
        </FormItem>
      )}
    />
  );
}

function PeriodField({ form }: FormComponentProps) {
  return (
    <FormField
      control={form.control}
      name='period'
      render={({ field }) => (
        <FormItem>
          <FormLabel>Period</FormLabel>
          <Select value={field.value} onValueChange={field.onChange}>
            <FormControl>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
            </FormControl>
            <SelectContent>
              {periods.map((period) => (
                <SelectItem key={period} value={period}>
                  {period}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <FormMessage />
        </FormItem>
      )}
    />
  );
}

function DescriptionField({ form }: FormComponentProps) {
  return (
    <FormField
      control={form.control}
      name='description'
      render={({ field }) => (
        <FormItem>
          <FormLabel>Description</FormLabel>
          <FormControl>
            <Textarea maxLength={250} placeholder='Optional note about this limit' {...field} />
          </FormControl>
          <FormMessage />
        </FormItem>
      )}
    />
  );
}

function ActiveField({ form }: FormComponentProps) {
  return (
    <FormField
      control={form.control}
      name='active'
      render={({ field }) => (
        <FormItem className='flex items-center justify-between rounded-md border p-3'>
          <div>
            <FormLabel>Active</FormLabel>
            <FormDescription>Include this limit in consumption warnings.</FormDescription>
          </div>
          <FormControl>
            <Switch checked={field.value} onCheckedChange={field.onChange} />
          </FormControl>
        </FormItem>
      )}
    />
  );
}

function SubmitButton({ form, isEditing, isPending }: FormComponentProps & { isEditing: boolean; isPending: boolean }) {
  const label = isEditing ? 'Update limit' : 'Create limit';

  return (
    <Button className='mt-2' disabled={isPending || (isEditing && !form.formState.isDirty)} type='submit'>
      {isPending ? <Icons.spinner className='size-5 animate-spin' /> : label}
    </Button>
  );
}
