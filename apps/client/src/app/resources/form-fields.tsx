import { Input } from '@kijk/ui/components/input';
import type { ControllerRenderProps, FieldPath } from 'react-hook-form';

import type { ResourceFormValues } from '@/app/resources/schemas';
import { FormControl, FormItem, FormLabel, FormMessage } from '@/shared/components/form';

interface FieldProps<TName extends keyof ResourceFormValues> {
  className?: string;
  field: ControllerRenderProps<ResourceFormValues, TName & FieldPath<ResourceFormValues>>;
}

export function ResourceNameField({ className, field }: FieldProps<'name'>) {
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

export function ResourceUnitField({ className, field }: FieldProps<'unit'>) {
  return (
    <FormItem className={className}>
      <FormLabel>Unit</FormLabel>
      <FormControl>
        <Input placeholder='Unit' {...field} />
      </FormControl>
      <FormMessage />
    </FormItem>
  );
}

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
