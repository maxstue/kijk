'use no memo';

import { useQuery } from '@tanstack/react-query';
import { toast } from 'sonner';

import type { UserUpdateFormValues } from '@/app/settings/profile/schemas';
import { userSignInQuery } from '@/app/root/use-signin-user';
import { userUpdateSchema } from '@/app/settings/profile/schemas';
import { useUpdateUser } from '@/app/settings/profile/user-update-user';
import { Button } from '@/shared/components/ui/button';
import { Checkbox } from '@/shared/components/ui/checkbox';
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/shared/components/ui/form';
import { Input } from '@/shared/components/ui/input';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';

export function ProfileForm() {
  const { data: user } = useQuery(userSignInQuery);

  const { mutate } = useUpdateUser();

  const form = useForm({
    resolver: zodResolver(userUpdateSchema),
    values: {
      userName: user?.name ?? '',
      useDefaultResources: user?.useDefaultResources ?? false,
    },
  });

  function onSubmit(data: UserUpdateFormValues) {
    if (user?.id) {
      mutate(data, {
        onSuccess() {
          toast('Successfully updated');
        },
      });
    }
  }

  return (
    <Form {...form}>
      <form className='space-y-8' onSubmit={form.handleSubmit(onSubmit)}>
        <FormField
          control={form.control}
          name='userName'
          render={({ field }) => (
            <FormItem>
              <FormLabel>Username</FormLabel>
              <FormControl>
                <Input placeholder='max' {...field} />
              </FormControl>
              <FormDescription>
                This is your public display name. It can be your real name or a pseudonym.
              </FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />
        <div className='flex w-full items-center'>
          <FormField
            control={form.control}
            name='useDefaultResources'
            render={({ field }) => (
              <FormItem className='flex w-full items-end justify-start gap-2'>
                <FormLabel>Use default resource types</FormLabel>
                <FormControl>
                  <Checkbox checked={field.value as boolean} onCheckedChange={field.onChange} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        <Button disabled={!form.formState.isDirty} type='submit'>
          Update profile
        </Button>
      </form>
    </Form>
  );
}
