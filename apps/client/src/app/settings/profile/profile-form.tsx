import { z } from 'zod';

import { Button } from '@/components/ui/button';
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form/form';
import { useZodForm } from '@/components/ui/form/use-zod-form';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { toast } from '@/hooks/use-toast';

const profileFormSchema = z.object({
  username: z
    .string()
    .min(2, {
      message: 'Username must be at least 2 characters.',
    })
    .max(30, {
      message: 'Username must not be longer than 30 characters.',
    }),
  email: z
    .string({
      required_error: 'Please select an email to display.',
    })
    .email(),
  bio: z.string().max(160).min(4),
});

type ProfileFormValues = z.infer<typeof profileFormSchema>;

// This can come from your database or API.
const defaultValues: Partial<ProfileFormValues> = {
  username: '',
  bio: 'I own a computer.',
};

export function ProfileForm() {
  const form = useZodForm({
    schema: profileFormSchema,
    defaultValues,
    mode: 'onBlur',
  });

  function onSubmit(data: ProfileFormValues) {
    toast({
      title: 'You submitted the following values:',
      description: (
        <pre className='mt-2 w-[340px] rounded bg-slate-950 p-4'>
          <code className='text-white'>{JSON.stringify(data, null, 2)}</code>
        </pre>
      ),
    });
  }

  return (
    <Form form={form} onSubmit={onSubmit} className='space-y-8'>
      <FormField
        control={form.control}
        name='username'
        render={({ field }) => (
          <FormItem>
            <FormLabel>Username</FormLabel>
            <FormControl>
              <Input placeholder='max' {...field} />
            </FormControl>
            <FormDescription>
              This is your public display name. It can be your real name or a pseudonym. You can only change this once
              every 30 days.
            </FormDescription>
            <FormMessage />
          </FormItem>
        )}
      />
      <FormField
        control={form.control}
        name='email'
        render={({ field }) => (
          <FormItem>
            <FormLabel>Email</FormLabel>
            <Select onValueChange={field.onChange} defaultValue={field.value}>
              <FormControl>
                <SelectTrigger>
                  <SelectValue placeholder='Select a verified email to display' />
                </SelectTrigger>
              </FormControl>
              <SelectContent>
                <SelectItem value='m@example.com'>m@example.com</SelectItem>
                <SelectItem value='m@google.com'>m@google.com</SelectItem>
                <SelectItem value='m@support.com'>m@support.com</SelectItem>
              </SelectContent>
            </Select>
            <FormMessage />
          </FormItem>
        )}
      />
      <FormField
        control={form.control}
        name='bio'
        render={({ field }) => (
          <FormItem>
            <FormLabel>Bio</FormLabel>
            <FormControl>
              <Textarea placeholder='Tell us a little bit about yourself' className='resize-none' {...field} />
            </FormControl>
            <FormDescription>
              You can <span>@mention</span> other users and organizations to link to them.
            </FormDescription>
            <FormMessage />
          </FormItem>
        )}
      />

      <Button type='submit'>Update profile</Button>
    </Form>
  );
}
