import { Checkbox } from '@kijk/ui/components/checkbox';
import { Input } from '@kijk/ui/components/input';
import type { ComponentProps } from 'react';
import { useFormContext } from 'react-hook-form';
import { z } from 'zod';

import type { UserUpdateFormValues } from '@/app/settings/profile/schemas';
import { FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from '@/shared/components/form';

import { DefaultSpaceSelect } from './default-space-select';
import { userUpdateSchema } from './schemas';
interface ProfileFieldProps {
  disabled: boolean;
}
interface DefaultSpaceFieldProps extends ProfileFieldProps {
  spaces: ComponentProps<typeof DefaultSpaceSelect>['spaces'];
}
export function SignInProfileField({ disabled }: ProfileFieldProps) {
  const { control } = useFormContext<z.input<typeof userUpdateSchema>, unknown, UserUpdateFormValues>();
  return (
    <FormField
      control={control}
      name='useExternalProfile'
      render={({ field }) => (
        <FormItem className='flex items-start gap-3 rounded-lg border p-4'>
          <FormControl>
            <Checkbox checked={field.value} disabled={disabled} onCheckedChange={field.onChange} />
          </FormControl>
          <div className='space-y-1'>
            <FormLabel>Use sign-in profile</FormLabel>
            <FormDescription>Show the full name and profile image from your sign-in account in Kijk.</FormDescription>
          </div>
          <FormMessage />
        </FormItem>
      )}
    />
  );
}
export function UsernameField() {
  const { control } = useFormContext<z.input<typeof userUpdateSchema>, unknown, UserUpdateFormValues>();
  return (
    <FormField
      control={control}
      name='userName'
      render={({ field }) => (
        <FormItem>
          <FormLabel>Username</FormLabel>
          <FormControl>
            <Input placeholder='max' {...field} />
          </FormControl>
          <FormDescription>This is how your name appears in Kijk. It does not affect sign-in.</FormDescription>
          <FormMessage />
        </FormItem>
      )}
    />
  );
}
export function DefaultSpaceField({ spaces, disabled }: DefaultSpaceFieldProps) {
  const { control } = useFormContext<z.input<typeof userUpdateSchema>, unknown, UserUpdateFormValues>();
  return (
    <FormField
      control={control}
      name='defaultSpaceId'
      render={({ field }) => (
        <DefaultSpaceSelect spaces={spaces} value={field.value} onChange={field.onChange} disabled={disabled} />
      )}
    />
  );
}
export function DefaultResourcesField({ disabled }: ProfileFieldProps) {
  const { control } = useFormContext<z.input<typeof userUpdateSchema>, unknown, UserUpdateFormValues>();
  return (
    <div className='flex w-full items-center'>
      <FormField
        control={control}
        name='useDefaultResources'
        render={({ field }) => (
          <FormItem className='flex w-full items-end justify-start gap-2'>
            <FormLabel>Use default resource types</FormLabel>
            <FormControl>
              <Checkbox checked={field.value} disabled={disabled} onCheckedChange={field.onChange} />
            </FormControl>
            <FormMessage />
          </FormItem>
        )}
      />
    </div>
  );
}
