'use no memo';

import { useUser } from '@clerk/react';
import { zodResolver } from '@hookform/resolvers/zod';
import { Button } from '@kijk/ui/components/button';
import { Checkbox } from '@kijk/ui/components/checkbox';
import { Input } from '@kijk/ui/components/input';
import { useQuery } from '@tanstack/react-query';
import { useForm } from 'react-hook-form';
import { toast } from 'sonner';

import type { UserUpdateFormValues } from '@/app/settings/profile/schemas';
import { userUpdateSchema } from '@/app/settings/profile/schemas';
import { useUpdateUser } from '@/app/settings/profile/use-update-user';
import { currentUserQueryOptions, signedInUserQueryOptions } from '@/shared/api/users/options';
import { AuthIdentitySummary } from '@/shared/components/auth-identity-summary';
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
  const { user: authUser } = useUser();
  const { data: user } = useQuery(signedInUserQueryOptions());
  const { data: currentUser } = useQuery(currentUserQueryOptions());
  const activeHousehold = currentUser?.households?.find((household) => household.isActive);

  const { mutate } = useUpdateUser();

  const form = useForm({
    resolver: zodResolver(userUpdateSchema),
    values: {
      householdName: activeHousehold?.name ?? '',
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
        <AuthIdentitySummary
          email={authUser?.primaryEmailAddress?.emailAddress ?? currentUser?.email ?? ''}
          fullName={authUser?.fullName ?? ''}
          imageUrl={authUser?.imageUrl ?? ''}
          provider={authUser?.externalAccounts.at(0)?.provider ?? 'email'}
        />
        <FormField
          control={form.control}
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
        <FormField
          control={form.control}
          name='householdName'
          render={({ field }) => (
            <FormItem>
              <FormLabel>Household name</FormLabel>
              <FormControl>
                <Input placeholder='My household' {...field} />
              </FormControl>
              <FormDescription>The name of your active household.</FormDescription>
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
