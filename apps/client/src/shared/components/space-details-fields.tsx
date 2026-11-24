import { Input } from '@kijk/ui/components/input';
import { Textarea } from '@kijk/ui/components/textarea';
import type { Control } from 'react-hook-form';

import { FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from '@/shared/components/form';
import type { SpaceDetailsFormValues } from '@/shared/lib/space-details';

interface Props {
  control: Control<SpaceDetailsFormValues>;
  disabled?: boolean;
}

/** Name and description fields of a space, used when creating and when editing a space. */
export function SpaceDetailsFields({ control, disabled }: Props) {
  return (
    <>
      <FormField
        control={control}
        name='name'
        render={({ field }) => (
          <FormItem>
            <FormLabel>Space name</FormLabel>
            <FormControl>
              <Input disabled={disabled} maxLength={100} {...field} />
            </FormControl>
            <FormDescription>This name is visible to everyone in the space.</FormDescription>
            <FormMessage />
          </FormItem>
        )}
      />
      <FormField
        control={control}
        name='description'
        render={({ field }) => (
          <FormItem>
            <FormLabel>Description</FormLabel>
            <FormControl>
              <Textarea disabled={disabled} maxLength={250} rows={4} {...field} />
            </FormControl>
            <FormDescription>Optional details about this space. Maximum 250 characters.</FormDescription>
            <FormMessage />
          </FormItem>
        )}
      />
    </>
  );
}
