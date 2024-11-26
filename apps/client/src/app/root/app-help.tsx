import { PropsWithChildren, useCallback, useState } from 'react';
import { ExternalLink, HelpCircle, LucideHeart } from 'lucide-react';

import { FeedbackFormValues, FeedbackSchema } from '@/app/root/schemas';
import { Button, buttonVariants } from '@/shared/components/ui/button';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/shared/components/ui/form/form';
import { useZodForm } from '@/shared/components/ui/form/use-zod-form';
import { Popover, PopoverContent, PopoverTrigger } from '@/shared/components/ui/popover';
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from '@/shared/components/ui/sheet';
import { Textarea } from '@/shared/components/ui/textarea';
import { env } from '@/shared/env';
import { toast } from '@/shared/hooks/use-toast';
import { AnalyticsService } from '@/shared/lib/analytics-tracking';
import { siteConfig } from '@/shared/lib/constants';
import { cn } from '@/shared/lib/helpers';

export function AppHelp() {
  const [showFeedback, setShowFeedback] = useState(false);

  const handleCloseFeedback = useCallback(() => {
    setShowFeedback(false);
  }, []);

  const handleOpenFeedback = useCallback(() => {
    setShowFeedback(true);
  }, []);

  return (
    <Sheet open={showFeedback} onOpenChange={setShowFeedback}>
      <Popover>
        <PopoverTrigger asChild>
          <Button className='bg-background-foreground' size='icon' variant='outline'>
            <HelpCircle className='h-4 w-4' />
          </Button>
        </PopoverTrigger>
        <PopoverContent className='bg-background-foreground mx-4 w-40 rounded-md border border-input p-2'>
          <div className='flex flex-col gap-1'>
            <ExSidebarItem to={siteConfig.links.support}>
              <div className='flex items-center gap-2 text-sm font-medium'>
                Support <ExternalLink className='h-3.5 w-3.5' />
              </div>
            </ExSidebarItem>
            <SheetTrigger asChild onClick={handleOpenFeedback}>
              <Button
                className='group h-8 items-center justify-start gap-2 py-0.5 pl-1 text-primary/65 hover:bg-primary/[0.05] data-[status=active]:bg-primary data-[status=active]:text-primary-foreground'
                variant='ghost'
              >
                Feedback
              </Button>
            </SheetTrigger>
          </div>
        </PopoverContent>
        <FeedbackSheet onClose={handleCloseFeedback} />
      </Popover>
    </Sheet>
  );
}

const onInvalid = () => {
  toast({ title: 'Invalid form', description: 'Something went wrong. Please try again later ' });
};

function FeedbackSheet({ onClose }: { onClose: () => void }) {
  const form = useZodForm({
    schema: FeedbackSchema,
    defaultValues: {
      message: '',
    },
  });

  const onSubmit = (data: FeedbackFormValues) => {
    AnalyticsService.getInstance().capture('survey sent', {
      $survey_id: env.PosthogSurveyId,
      $survey_response: data.message,
    });
    toast({ title: 'Feedback sent', description: 'Thank you for your feedback!' });
    form.reset();
    onClose();
  };

  return (
    <>
      <SheetContent className='space-y-8'>
        <SheetHeader>
          <SheetTitle className='flex items-center gap-1'>
            Give us Feedback <LucideHeart className='h-4 text-red-500' />
          </SheetTitle>
          <SheetDescription>Sending us any feedback will improve this app for everyone.</SheetDescription>
          <Form className='space-y-4' form={form} onInvalid={onInvalid} onSubmit={onSubmit}>
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
          </Form>
        </SheetHeader>
      </SheetContent>
    </>
  );
}

interface ExSidebarItemProps {
  to: string;
}

const ExSidebarItem = ({ children, to }: PropsWithChildren<ExSidebarItemProps>) => {
  return (
    <a
      key={to}
      href={to}
      rel='noopener noreferrer'
      target='_blank'
      className={cn(
        buttonVariants({ variant: 'ghost' }),
        'group h-8 items-center justify-start gap-2 py-0.5 pl-1 text-primary/65 hover:bg-primary/[0.05] data-[status=active]:bg-primary data-[status=active]:text-primary-foreground',
      )}
    >
      <div className='flex w-auto flex-1 items-center justify-between gap-2 overflow-hidden'>
        <div>{children}</div>
      </div>
    </a>
  );
};
