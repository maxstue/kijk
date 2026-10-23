import { zodResolver } from '@hookform/resolvers/zod';
import * as usersOptions from '@kijk/api/users/options';
import { Button } from '@kijk/ui/components/button';
import { DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@kijk/ui/components/dialog';
import { Textarea } from '@kijk/ui/components/textarea';
import { useMutation } from '@tanstack/react-query';
import { LucideHeart } from 'lucide-react';
import { useForm } from 'react-hook-form';
import { toast } from 'sonner';

import type { FeedbackFormValues } from '@/app/root/schemas';
import { feedbackSchema } from '@/app/root/schemas';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/shared/components/form';

const onInvalid = () => {
  toast('Invalid form', { description: 'Something went wrong. Please try again later ' });
};

/** Dialog that sends user feedback as a PostHog survey response. */
export function FeedbackDialog({ onClose }: { onClose: () => void }) {
  const { mutate, isPending } = useMutation(usersOptions.feedbackMutationOptions());
  const form = useForm({
    defaultValues: {
      message: '',
    },
    resolver: zodResolver(feedbackSchema),
  });

  const onSubmit = (data: FeedbackFormValues) => {
    mutate(data, {
      onSuccess() {
        toast('Feedback sent', { description: 'Thank you for your feedback!' });
        form.reset();
        onClose();
      },
      onError() {
        toast('Feedback could not be sent', { description: 'Your message is still here. Please try again later.' });
      },
    });
  };

  return (
    <DialogContent>
      <DialogHeader>
        <DialogTitle className='flex items-center gap-1'>
          Give us Feedback <LucideHeart className='h-4 text-red-500' />
        </DialogTitle>
        <DialogDescription>
          Your message is sent to PostHog in the EU to improve Kijk, independently of your analytics settings. We do not
          attach your account identity. Please leave out personal and financial details.
        </DialogDescription>
      </DialogHeader>
      <Form {...form}>
        <form className='space-y-4' onSubmit={form.handleSubmit(onSubmit, onInvalid)}>
          <FormField
            control={form.control}
            name='message'
            render={({ field }) => (
              <FormItem>
                <FormLabel>Message</FormLabel>
                <FormControl>
                  <Textarea placeholder='Help us improve our app...' maxLength={4000} disabled={isPending} {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <Button type='submit' disabled={isPending}>
            {isPending ? 'Sending…' : 'Send'}
          </Button>
        </form>
      </Form>
    </DialogContent>
  );
}
