import * as unitsOptions from '@kijk/api/units/options';
import { Input } from '@kijk/ui/components/input';
import { Select, SelectContent, SelectTrigger, SelectValue } from '@kijk/ui/components/select';
import { useSuspenseQuery } from '@tanstack/react-query';
import type { ControllerRenderProps, FieldPath } from 'react-hook-form';

import type { ResourceFormValues } from '@/app/resources/schemas';
import { UnitSelectOptions, unitSelectItems } from '@/app/resources/unit-select-options';
import { FormControl, FormItem, FormLabel, FormMessage } from '@/shared/components/form';

import { ResourceIconPicker } from './icon-picker';

interface FieldProps<TName extends keyof ResourceFormValues> {
  className?: string;
  field: ControllerRenderProps<ResourceFormValues, TName & FieldPath<ResourceFormValues>>;
}

/** Name input of the resource forms. */
export function ResourceNameField({ className, field }: FieldProps<'name'>) {
  return (
    <FormItem className={className}>
      <FormLabel>Name</FormLabel>
      <FormControl>
        <Input maxLength={30} placeholder='Name' {...field} />
      </FormControl>
      <FormMessage />
    </FormItem>
  );
}

/** Unit select of the resource forms. */
export function ResourceUnitField({ className, field }: FieldProps<'unitId'>) {
  const { data: units } = useSuspenseQuery(unitsOptions.listQueryOptions());

  return (
    <FormItem className={className}>
      <FormLabel>Unit</FormLabel>
      <FormControl>
        <Select items={unitSelectItems(units)} value={field.value} onValueChange={field.onChange}>
          <SelectTrigger aria-label='Unit' className='w-full'>
            <SelectValue placeholder='Select a unit' />
          </SelectTrigger>
          <SelectContent>
            <UnitSelectOptions units={units} />
          </SelectContent>
        </Select>
      </FormControl>
      <FormMessage />
    </FormItem>
  );
}

/** Color input of the resource forms. */
export function ResourceColorField({ className, field }: FieldProps<'color'>) {
  return (
    <FormItem className={className}>
      <FormLabel>Color</FormLabel>
      <FormControl>
        <Input placeholder='Color, e.g. `#123456`' type='color' {...field} onChange={field.onChange} />
      </FormControl>
      <FormMessage />
    </FormItem>
  );
}

/** Icon picker field of the resource forms. */
export function ResourceIconField({ className, field }: FieldProps<'icon'>) {
  return (
    <FormItem className={className}>
      <FormLabel>Icon</FormLabel>
      <FormControl>
        <ResourceIconPicker value={field.value} onChange={field.onChange} />
      </FormControl>
      <FormMessage />
    </FormItem>
  );
}
