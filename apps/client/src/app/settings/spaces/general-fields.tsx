import { Input } from '@kijk/ui/components/input';
import { Textarea } from '@kijk/ui/components/textarea';
import type { Control } from 'react-hook-form';

import type { SpaceUpdateFormValues } from '@/app/settings/spaces/schemas';
import { FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from '@/shared/components/form';
interface SpaceGeneralFieldsProps {
  control: Control<SpaceUpdateFormValues>;
}
export function SpaceGeneralFields({ control }: SpaceGeneralFieldsProps) {
  return (
    <>
      <FormField
        control={control}
        name='name'
        render={({ field }) => (
          <FormItem>
            <FormLabel>Space name</FormLabel>
            <FormControl>
              <Input maxLength={100} {...field} />
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
              <Textarea maxLength={250} rows={4} {...field} />
            </FormControl>
            <FormDescription>Optional details about this space. Maximum 250 characters.</FormDescription>
            <FormMessage />
          </FormItem>
        )}
      />
    </>
  );
}
