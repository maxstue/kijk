import { useQuery } from '@tanstack/react-query';

import { userSignInQuery } from '@/app/root/use-signin-user';
import { UserUpdateFormValues, userUpdateSchema } from '@/app/settings/profile/schemas';
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
} from '@/shared/components/ui/form/form';
import { useZodForm } from '@/shared/components/ui/form/use-zod-form';
import { Input } from '@/shared/components/ui/input';
import { toast } from '@/shared/hooks/use-toast';

export function ProfileForm() {
  const userQuery = useQuery(userSignInQuery);

  const form = useZodForm({
    schema: userUpdateSchema,
    values: {
      userName: userQuery.data?.data?.name ?? '',
      useDefaultCategories: userQuery.data?.data?.useDefaultCategories ?? false,
    },
    mode: 'onBlur',
  });
  const { mutate } = useUpdateUser();
  const { formState } = form;

  function onSubmit(data: UserUpdateFormValues) {
    if (userQuery.data?.data?.id) {
      mutate(data, {
        onSuccess() {
          toast({
            title: 'Successfully updated',
            variant: 'default',
          });
        },
      });
    }
  }

  return (
    <Form form={form} onSubmit={onSubmit} className='space-y-8'>
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
          name='useDefaultCategories'
          render={({ field }) => (
            <FormItem className='flex w-full items-end justify-start gap-2'>
              <FormLabel>Use default Categories</FormLabel>
              <FormControl>
                <Checkbox checked={field.value} onCheckedChange={field.onChange} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
      </div>

      <Button type='submit' disabled={!formState.isDirty}>
        Update profile
      </Button>
    </Form>
  );
}
