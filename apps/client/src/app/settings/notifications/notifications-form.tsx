import { z } from 'zod';

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
import { RadioGroup, RadioGroupItem } from '@/shared/components/ui/radio-group';
import { Switch } from '@/shared/components/ui/switch';
import { toast } from '@/shared/hooks/use-toast';

const notificationsFormSchema = z.object({
  type: z.enum(['all', 'mentions', 'none'], {
    required_error: 'You need to select a notification type.',
  }),
  mobile: z.boolean().default(false).optional(),
  communication_emails: z.boolean().default(false).optional(),
  social_emails: z.boolean().default(false).optional(),
  marketing_emails: z.boolean().default(false).optional(),
  security_emails: z.boolean(),
});

type NotificationsFormValues = z.infer<typeof notificationsFormSchema>;

// This can come from your database or API.
const defaultValues: Partial<NotificationsFormValues> = {
  communication_emails: false,
  marketing_emails: false,
  social_emails: true,
  security_emails: true,
};

export function NotificationsForm() {
  const form = useZodForm({
    schema: notificationsFormSchema,
    defaultValues,
  });

  function onSubmit(data: NotificationsFormValues) {
    toast({
      title: 'You submitted the following values:',
      description: (
        <pre className='mt-2 w-[340px] rounded bg-slate-950 p-4'>
          <code className='text-white'>{JSON.stringify(data, undefined, 2)}</code>
        </pre>
      ),
    });
  }

  return (
    <Form className='space-y-8' form={form} onSubmit={onSubmit}>
      <FormField
        control={form.control}
        name='type'
        render={({ field }) => (
          <FormItem className='space-y-3'>
            <FormLabel>Notify me about...</FormLabel>
            <FormControl>
              <RadioGroup className='flex flex-col space-y-1' defaultValue={field.value} onValueChange={field.onChange}>
                <FormItem className='flex items-center space-x-3 space-y-0'>
                  <FormControl>
                    <RadioGroupItem value='all' />
                  </FormControl>
                  <FormLabel className='font-normal'>All new messages</FormLabel>
                </FormItem>
                <FormItem className='flex items-center space-x-3 space-y-0'>
                  <FormControl>
                    <RadioGroupItem value='mentions' />
                  </FormControl>
                  <FormLabel className='font-normal'>Direct messages and mentions</FormLabel>
                </FormItem>
                <FormItem className='flex items-center space-x-3 space-y-0'>
                  <FormControl>
                    <RadioGroupItem value='none' />
                  </FormControl>
                  <FormLabel className='font-normal'>Nothing</FormLabel>
                </FormItem>
              </RadioGroup>
            </FormControl>
            <FormMessage />
          </FormItem>
        )}
      />
      <div>
        <h3 className='mb-4 text-lg font-medium'>Email Notifications</h3>
        <div className='space-y-4'>
          <FormField
            control={form.control}
            name='communication_emails'
            render={({ field }) => (
              <FormItem className='flex flex-row items-center justify-between rounded border p-4'>
                <div className='space-y-0.5'>
                  <FormLabel className='text-base'>Communication emails</FormLabel>
                  <FormDescription>Receive emails about your account activity.</FormDescription>
                </div>
                <FormControl>
                  <Switch checked={field.value} onCheckedChange={field.onChange} />
                </FormControl>
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name='marketing_emails'
            render={({ field }) => (
              <FormItem className='flex flex-row items-center justify-between rounded border p-4'>
                <div className='space-y-0.5'>
                  <FormLabel className='text-base'>Marketing emails</FormLabel>
                  <FormDescription>Receive emails about new products, features, and more.</FormDescription>
                </div>
                <FormControl>
                  <Switch checked={field.value} onCheckedChange={field.onChange} />
                </FormControl>
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name='social_emails'
            render={({ field }) => (
              <FormItem className='flex flex-row items-center justify-between rounded border p-4'>
                <div className='space-y-0.5'>
                  <FormLabel className='text-base'>Social emails</FormLabel>
                  <FormDescription>Receive emails for friend requests, follows, and more.</FormDescription>
                </div>
                <FormControl>
                  <Switch checked={field.value} onCheckedChange={field.onChange} />
                </FormControl>
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name='security_emails'
            render={({ field }) => (
              <FormItem className='flex flex-row items-center justify-between rounded border p-4'>
                <div className='space-y-0.5'>
                  <FormLabel className='text-base'>Security emails</FormLabel>
                  <FormDescription>Receive emails about your account activity and security.</FormDescription>
                </div>
                <FormControl>
                  <Switch aria-readonly disabled checked={field.value} onCheckedChange={field.onChange} />
                </FormControl>
              </FormItem>
            )}
          />
        </div>
      </div>
      <FormField
        control={form.control}
        name='mobile'
        render={({ field }) => (
          <FormItem className='flex flex-row items-start space-x-3 space-y-0'>
            <FormControl>
              <Checkbox checked={field.value} onCheckedChange={field.onChange} />
            </FormControl>
            <div className='space-y-1 leading-none'>
              <FormLabel>Use different settings for my mobile devices</FormLabel>
            </div>
          </FormItem>
        )}
      />
      <Button type='submit'>Update notifications</Button>
    </Form>
  );
}
