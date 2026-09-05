import { zodResolver } from '@hookform/resolvers/zod';
import { Button } from '@kijk/ui/components/button';
import { DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@kijk/ui/components/dialog';
import { Textarea } from '@kijk/ui/components/textarea';
import { LucideHeart } from 'lucide-react';
import { useForm } from 'react-hook-form';
import { toast } from 'sonner';

import type { FeedbackFormValues } from '@/app/root/schemas';
import { feedbackSchema } from '@/app/root/schemas';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/shared/components/form';
import { config } from '@/shared/config';
import { AnalyticsService } from '@/shared/lib/analytics-tracking';

const onInvalid = () => {
  toast('Invalid form', { description: 'Something went wrong. Please try again later ' });
};

export function FeedbackDialog({ onClose }: { onClose: () => void }) {
  const form = useForm({
    defaultValues: {
      message: '',
    },
    resolver: zodResolver(feedbackSchema),
  });

  const onSubmit = (data: FeedbackFormValues) => {
    AnalyticsService.getInstance().capture('survey sent', {
      $survey_id: config.PosthogSurveyId,
      $survey_response: data.message,
    });
    toast('Feedback sent', { description: 'Thank you for your feedback!' });
    form.reset();
    onClose();
  };

  return (
    <DialogContent className='max-h-[calc(100vh-2rem)] overflow-y-auto sm:max-w-lg'>
      <DialogHeader>
        <DialogTitle className='flex items-center gap-1'>
          Give us Feedback <LucideHeart className='h-4 text-red-500' />
        </DialogTitle>
        <DialogDescription>Sending us any feedback will improve this app for everyone.</DialogDescription>
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
                  <Textarea placeholder='Help us improve our app...' {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <Button type='submit'>Send</Button>
        </form>
      </Form>
    </DialogContent>
  );
}
