import { Checkbox } from '@kijk/ui/components/checkbox';
import { Input } from '@kijk/ui/components/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@kijk/ui/components/select';
import { Tooltip, TooltipContent, TooltipTrigger } from '@kijk/ui/components/tooltip';
import { useSuspenseQuery } from '@tanstack/react-query';
import { format } from 'date-fns';
import { InfoIcon } from 'lucide-react';
import { useFormContext, useWatch } from 'react-hook-form';
import type { ControllerRenderProps, FieldPath } from 'react-hook-form';

import type { ConsumptionCreateFormSchema, ConsumptionUpdateFormSchema } from '@/app/consumptions/schemas';
import { resourcesQueryOptions } from '@/shared/api/resources/options';
import { DatePicker } from '@/shared/components/date-picker';
import { FormControl, FormItem, FormLabel, FormMessage } from '@/shared/components/form';
import { ResourceUnit } from '@/shared/components/resources-unit';
import type { Consumption } from '@/shared/types/domain';
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

interface RunningTotalProps {
  consumptions: Consumption[];
  excludeId?: string;
}

export function ConsumptionRunningTotal({ consumptions, excludeId }: RunningTotalProps) {
  const { control } = useFormContext<ConsumptionFormValues>();
  const date = useWatch({ control, name: 'date' });
  const resourceId = useWatch({ control, name: 'resourceId' });
  const value = useWatch({ control, name: 'value' });
  const valueType = useWatch({ control, name: 'valueType' });
  const { data: resources } = useSuspenseQuery(resourcesQueryOptions());
  const resource = resources.find((item) => item.id === resourceId);
  const entryDate = date instanceof Date ? format(date, 'yyyy-MM-dd') : '';
  const previousEntry = consumptions.find(
    (item) =>
      item.id !== excludeId &&
      item.resource.id === resourceId &&
      item.date.slice(0, 10) <= entryDate &&
      item.calculatedMeterReading != null,
  );
  const numericValue = Number(value);
  const total =
    valueType === ValueTypes.ABSOLUTE
      ? numericValue
      : previousEntry?.calculatedMeterReading == null
        ? undefined
        : Number(previousEntry.calculatedMeterReading) + numericValue;

  return (
    <div className='bg-muted/40 grid grid-cols-[minmax(0,1fr)_auto_auto] items-baseline gap-2 rounded-md px-3 py-2 text-sm'>
      <span className='text-muted-foreground'>Running meter total</span>
      <span className='text-right font-medium tabular-nums'>{Number.isFinite(total) ? total : '—'}</span>
      {Number.isFinite(total) ? <ResourceUnit type={resource} /> : <span />}
    </div>
  );
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
            <button type='button' aria-label='Explain entry type'>
              <InfoIcon className='text-muted-foreground size-4' />
            </button>
          </TooltipTrigger>
          <TooltipContent>
            <p className='max-w-64 text-sm'>
              {field.value === ValueTypes.ABSOLUTE
                ? 'Enter the cumulative value currently shown on the meter.'
                : 'Enter the consumed amount, not the meter value. It is added to the last known meter reading to calculate the running total.'}
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

export function ConsumptionResetField<TFormValues extends ConsumptionFormValues>({
  className,
  field,
}: FieldProps<TFormValues, 'startsNewMeterSegment'>) {
  const { control } = useFormContext<TFormValues>();
  const valueType = useWatch<TFormValues>({ control, name: 'valueType' as FieldPath<TFormValues> });

  if (valueType !== ValueTypes.ABSOLUTE) {
    return null;
  }

  return (
    <FormItem className={className}>
      <div className='border-primary/20 bg-primary/5 flex items-start gap-3 rounded-md border border-l-2 p-3'>
        <FormControl>
          <Checkbox checked={field.value} onCheckedChange={(checked) => field.onChange(checked === true)} />
        </FormControl>
        <div className='space-y-1 leading-none'>
          <FormLabel>Meter replacement or counter reset</FormLabel>
          <p className='text-muted-foreground text-sm leading-normal'>
            Start a new calculation segment at this reading. Earlier measurement history remains unchanged.
          </p>
        </div>
      </div>
      <FormMessage />
    </FormItem>
  );
}
