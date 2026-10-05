import { Input } from '@kijk/ui/components/input';
import { Select, SelectContent, SelectTrigger, SelectValue } from '@kijk/ui/components/select';
import { useSuspenseQuery } from '@tanstack/react-query';
import type { ControllerRenderProps, FieldPath } from 'react-hook-form';

import type { ResourceFormValues } from '@/app/resources/schemas';
import { unitsQueryOptions } from '@/shared/api/units/options';
import { FormControl, FormItem, FormLabel, FormMessage } from '@/shared/components/form';
import { UnitSelectOptions } from '@/shared/components/unit-select-options';

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
  const { data } = useSuspenseQuery(unitsQueryOptions());
  const availableUnits = data.filter((unit) => unit.creatorType === 'System' || unit.isAvailableInActiveSpace);

  return (
    <FormItem className={className}>
      <FormLabel>Unit</FormLabel>
      <FormControl>
        <Select value={field.value} onValueChange={field.onChange}>
          <SelectTrigger aria-label='Unit'>
            <SelectValue placeholder='Select a unit' />
          </SelectTrigger>
          <SelectContent>
            <UnitSelectOptions units={availableUnits} />
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
