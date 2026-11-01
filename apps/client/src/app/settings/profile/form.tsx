import { zodResolver } from '@hookform/resolvers/zod';
import * as usersOptions from '@kijk/api/users/options';
import { Button } from '@kijk/ui/components/button';
import { Checkbox } from '@kijk/ui/components/checkbox';
import { Input } from '@kijk/ui/components/input';
import { useMutation, useQuery } from '@tanstack/react-query';
import { useForm } from 'react-hook-form';
import { toast } from 'sonner';

import { ConnectedSignInMethods } from '@/app/settings/profile/providers';
import type { UserUpdateFormValues } from '@/app/settings/profile/schemas';
import { userUpdateSchema } from '@/app/settings/profile/schemas';
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

import { DefaultSpaceSelect } from './default-space-select';

/** Form for the display name, default space, default resources and profile usage. */
export function ProfileForm() {
  const { data: currentAccount } = useQuery(usersOptions.meQueryOptions());
  const currentUser = currentAccount?.user;
  const externalIdentity = currentUser?.externalIdentity;

  const profileMutation = useMutation(usersOptions.updateMutationOptions());
  const defaultSpaceMutation = useMutation(usersOptions.setDefaultSpaceMutationOptions());

  const form = useForm({
    resolver: zodResolver(userUpdateSchema),
    values: {
      defaultSpaceId: currentUser?.spaces?.find((space) => space.isDefault)?.id ?? null,
      useDefaultResources: currentUser?.resources?.some((resource) => resource.creatorType === 'System') ?? false,
      useExternalProfile: currentUser?.useExternalProfile ?? false,
      userName: currentUser?.name ?? '',
    },
    resetOptions: { keepDirtyValues: true },
  });
  const { dirtyFields, isDirty, isSubmitting } = form.formState;

  async function onSubmit(data: UserUpdateFormValues) {
    if (!currentUser?.id) {
      return;
    }
    const { defaultSpaceId, ...profile } = data;
    try {
      if (dirtyFields.userName || dirtyFields.useDefaultResources || dirtyFields.useExternalProfile) {
        await profileMutation.mutateAsync(profile);
      }
      if (dirtyFields.defaultSpaceId) {
        await defaultSpaceMutation.mutateAsync(defaultSpaceId);
      }
      form.reset(data);
      toast.success('Profile updated');
    } catch (error) {
      toast.error('Your changes could not all be saved. Please try again.', {
        description: error instanceof Error ? error.message : undefined,
      });
    }
  }

  return (
    <Form {...form}>
      <form className='space-y-8' onSubmit={form.handleSubmit(onSubmit)}>
        <fieldset disabled={isSubmitting || !currentUser?.id} className='space-y-8'>
          <AuthIdentitySummary
            email={externalIdentity?.email}
            fullName={externalIdentity?.fullName}
            imageUrl={externalIdentity?.imageUrl}
            profileEnabled={currentUser?.useExternalProfile ?? false}
          />
          <ConnectedSignInMethods />
          <FormField
            control={form.control}
            name='useExternalProfile'
            render={({ field }) => (
              <FormItem className='flex items-start gap-3 rounded-lg border p-4'>
                <FormControl>
                  <Checkbox
                    checked={field.value}
                    disabled={isSubmitting || !currentUser?.id}
                    onCheckedChange={field.onChange}
                  />
                </FormControl>
                <div className='space-y-1'>
                  <FormLabel>Use sign-in profile</FormLabel>
                  <FormDescription>
                    Show the full name and profile image from your sign-in account in Kijk.
                  </FormDescription>
                </div>
                <FormMessage />
              </FormItem>
            )}
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
            name='defaultSpaceId'
            render={({ field }) => (
              <DefaultSpaceSelect
                spaces={currentUser?.spaces ?? []}
                value={field.value}
                onChange={field.onChange}
                disabled={isSubmitting || !currentUser?.id}
              />
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
                    <Checkbox
                      checked={field.value}
                      disabled={isSubmitting || !currentUser?.id}
                      onCheckedChange={field.onChange}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>

          <Button disabled={!isDirty || isSubmitting} type='submit'>
            {isSubmitting ? 'Saving…' : 'Update profile'}
          </Button>
        </fieldset>
      </form>
    </Form>
  );
}
