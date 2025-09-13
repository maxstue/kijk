import { useCallback, useState } from 'react';
import { ExternalLinkIcon, LucideHeart, SendIcon, SettingsIcon } from 'lucide-react';
import { toast } from 'sonner';

import { Link } from '@tanstack/react-router';
import type { FeedbackFormValues } from '@/app/root/schemas';
import { feedbackSchema } from '@/app/root/schemas';
import { Button } from '@/shared/components/ui/button';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/shared/components/ui/form';
import { useZodForm } from '@/shared/components/ui/form/use-zod-form';
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from '@/shared/components/ui/sheet';
import {
  SidebarGroup,
  SidebarGroupContent,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from '@/shared/components/ui/sidebar';
import { Textarea } from '@/shared/components/ui/textarea';
import { env } from '@/shared/env';
import { AnalyticsService } from '@/shared/lib/analytics-client';
import { siteConfig } from '@/shared/lib/constants';

interface Props extends React.ComponentPropsWithoutRef<typeof SidebarGroup> {}

export function NavSecondary({ ...props }: Props) {
  const [showFeedback, setShowFeedback] = useState(false);

  const handleCloseFeedback = useCallback(() => setShowFeedback(false), []);

  const handleOpenFeedback = useCallback(() => setShowFeedback(true), []);

  return (
    <SidebarGroup {...props}>
      <Sheet open={showFeedback} onOpenChange={setShowFeedback}>
        <SidebarGroupContent>
          <SidebarMenu>
            <SidebarMenuItem key='Settings'>
              <SidebarMenuButton asChild>
                <Link
                  activeOptions={{ exact: false }}
                  activeProps={{ className: 'bg-sidebar-accent text-sidebar-accent-foreground' }}
                  to='/settings'
                >
                  <SettingsIcon />
                  <span>Settings</span>
                </Link>
              </SidebarMenuButton>
            </SidebarMenuItem>
            <SidebarMenuItem key='Support'>
              <SidebarMenuButton asChild size='sm'>
                <a href={siteConfig.links.support} rel='noopener noreferrer' target='_blank'>
                  <ExternalLinkIcon />
                  <span>Support</span>
                </a>
              </SidebarMenuButton>
            </SidebarMenuItem>
            <SidebarMenuItem key='Feedback'>
              <SidebarMenuButton asChild size='sm'>
                <SheetTrigger onClick={handleOpenFeedback}>
                  <SendIcon />
                  <span>Feedback</span>
                </SheetTrigger>
              </SidebarMenuButton>
            </SidebarMenuItem>
          </SidebarMenu>
        </SidebarGroupContent>
        <FeedbackSheet onClose={handleCloseFeedback} />
      </Sheet>
    </SidebarGroup>
  );
}

const onInvalid = () => {
  toast('Invalid form', { description: 'Something went wrong. Please try again later ' });
};

function FeedbackSheet({ onClose }: { onClose: () => void }) {
  const form = useZodForm({
    schema: feedbackSchema,
    defaultValues: {
      message: '',
    },
  });

  const onSubmit = (data: FeedbackFormValues) => {
    AnalyticsService.getInstance().capture('survey sent', {
      $survey_id: env.PosthogSurveyId,
      $survey_response: data.message,
    });
    toast('Feedback sent', { description: 'Thank you for your feedback!' });
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
