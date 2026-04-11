import { zodResolver } from '@hookform/resolvers/zod';
import { Button } from '@kijk/ui/components/button';
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from '@kijk/ui/components/sheet';
import {
  SidebarGroup,
  SidebarGroupContent,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from '@kijk/ui/components/sidebar';
import { Textarea } from '@kijk/ui/components/textarea';
import { Link } from '@tanstack/react-router';
import { ExternalLinkIcon, LucideHeart, SendIcon, SettingsIcon } from 'lucide-react';
import { useCallback, useState } from 'react';
import { useForm } from 'react-hook-form';
import { toast } from 'sonner';

import type { FeedbackFormValues } from '@/app/root/schemas';
import { feedbackSchema } from '@/app/root/schemas';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/shared/components/form';
import { config } from '@/shared/config';
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
    <>
      <SheetContent className='space-y-8'>
        <SheetHeader>
          <SheetTitle className='flex items-center gap-1'>
            Give us Feedback <LucideHeart className='h-4 text-red-500' />
          </SheetTitle>
          <SheetDescription>Sending us any feedback will improve this app for everyone.</SheetDescription>
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
        </SheetHeader>
      </SheetContent>
    </>
  );
}
