import { Input } from '@kijk/ui/components/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@kijk/ui/components/select';
import { Tooltip, TooltipContent, TooltipTrigger } from '@kijk/ui/components/tooltip';
import { useSuspenseQuery } from '@tanstack/react-query';
import { InfoIcon } from 'lucide-react';
import { useFormContext, useWatch } from 'react-hook-form';
import type { ControllerRenderProps, FieldPath } from 'react-hook-form';

import type { ConsumptionCreateFormSchema, ConsumptionUpdateFormSchema } from '@/app/consumptions/schemas';
import { resourcesQueryOptions } from '@/shared/api/resources/options';
import { DatePicker } from '@/shared/components/date-picker';
import { FormControl, FormItem, FormLabel, FormMessage } from '@/shared/components/form';
import { ResourceUnit } from '@/shared/components/resources-unit';
import { ValueTypes } from '@/shared/types/domain';

type ConsumptionFormValues = ConsumptionCreateFormSchema | ConsumptionUpdateFormSchema;
type ConsumptionFieldPath<
  TFormValues extends ConsumptionFormValues,
  TName extends keyof ConsumptionCreateFormSchema,
> = TName & FieldPath<TFormValues>;

interface FieldProps<TFormValues extends ConsumptionFormValues, TName extends keyof ConsumptionCreateFormSchema> {
  className?: string;
  field: ControllerRenderProps<TFormValues, ConsumptionFieldPath<TFormValues, TName>>;
}

export function ConsumptionNameField<TFormValues extends ConsumptionFormValues>({
  className,
  field,
}: FieldProps<TFormValues, 'name'>) {
  return (
    <FormItem className={className}>
      <FormLabel>Name</FormLabel>
      <FormControl>
        <Input placeholder='Name' {...field} />
      </FormControl>
      <FormMessage />
    </FormItem>
  );
}

export function ConsumptionValueField<TFormValues extends ConsumptionFormValues>({
  className,
  field,
}: FieldProps<TFormValues, 'value'>) {
  const { control } = useFormContext<TFormValues>();
  const resourceId = useWatch<TFormValues>({ control, name: 'resourceId' as FieldPath<TFormValues> });
  const valueType = useWatch<TFormValues>({ control, name: 'valueType' as FieldPath<TFormValues> });
  const { data } = useSuspenseQuery(resourcesQueryOptions());
  const resource = data.find((item) => item.id === resourceId);

  return (
    <FormItem className={className}>
      <FormLabel className='flex gap-2'>
        {valueType === ValueTypes.ABSOLUTE ? 'Meter reading' : 'Consumption since previous reading'}
        <div className='flex'>
          (<ResourceUnit type={resource} />)
        </div>
      </FormLabel>
      <FormControl>
        <Input
          placeholder={valueType === ValueTypes.ABSOLUTE ? 'Current meter reading' : 'Consumed amount'}
          type='number'
          {...field}
          onChange={(event) => field.onChange(event.target.valueAsNumber)}
        />
      </FormControl>
      <FormMessage />
    </FormItem>
  );
}

export function ConsumptionValueTypeField<TFormValues extends ConsumptionFormValues>({
  className,
  field,
}: FieldProps<TFormValues, 'valueType'>) {
  return (
    <FormItem className={className}>
      <FormLabel className='flex items-center gap-2'>
        Entry type
        <Tooltip>
          <TooltipTrigger asChild>
            <InfoIcon className='text-muted-foreground size-4' />
          </TooltipTrigger>
          <TooltipContent>
            <p className='max-w-64 text-sm'>
              A meter reading is cumulative. Consumption since the previous reading is added directly to the period.
            </p>
          </TooltipContent>
        </Tooltip>
      </FormLabel>

      <Select value={field.value} onValueChange={field.onChange}>
        <FormControl>
          <SelectTrigger>
            <SelectValue />
          </SelectTrigger>
        </FormControl>
        <SelectContent>
          <SelectItem value={ValueTypes.ABSOLUTE}>Meter reading</SelectItem>
          <SelectItem value={ValueTypes.RELATIVE}>Consumption since previous reading</SelectItem>
        </SelectContent>
      </Select>
      <p className='text-muted-foreground text-xs'>
        {field.value === ValueTypes.ABSOLUTE
          ? 'Enter the cumulative value currently shown on the meter.'
          : 'Enter only the amount consumed since the previous reading.'}
      </p>
    </FormItem>
  );
}

export function ConsumptionResourceField<TFormValues extends ConsumptionFormValues>({
  className,
  field,
}: FieldProps<TFormValues, 'resourceId'>) {
  const { data } = useSuspenseQuery(resourcesQueryOptions());

  return (
    <FormItem className={className}>
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

export function ConsumptionDateField<TFormValues extends ConsumptionFormValues>({
  className,
  field,
}: FieldProps<TFormValues, 'date'>) {
  return (
    <FormItem className={className}>
      <FormLabel>Date</FormLabel>
      <FormControl>
        <DatePicker date={field.value} setDate={field.onChange} {...field} />
      </FormControl>
      <FormMessage />
    </FormItem>
  );
}
