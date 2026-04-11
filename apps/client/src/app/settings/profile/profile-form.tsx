'use no memo';

import { zodResolver } from '@hookform/resolvers/zod';
import { Button } from '@kijk/ui/components/button';
import { Checkbox } from '@kijk/ui/components/checkbox';
import { Input } from '@kijk/ui/components/input';
import { useQuery } from '@tanstack/react-query';
import { useForm } from 'react-hook-form';
import { toast } from 'sonner';

import { userSignInQuery } from '@/app/root/use-signin-user';
import type { UserUpdateFormValues } from '@/app/settings/profile/schemas';
import { userUpdateSchema } from '@/app/settings/profile/schemas';
import { useUpdateUser } from '@/app/settings/profile/user-update-user';
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/shared/components/form';

export function ProfileForm() {
  const { data: user } = useQuery(userSignInQuery);

  const { mutate } = useUpdateUser();

  const form = useForm({
    resolver: zodResolver(userUpdateSchema),
    values: {
      useDefaultResources: user?.useDefaultResources ?? false,
      userName: user?.name ?? '',
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
                  <Checkbox checked={field.value} onCheckedChange={field.onChange} />
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
