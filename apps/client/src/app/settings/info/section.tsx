import { zodResolver } from '@hookform/resolvers/zod';
import { cn } from '@kijk/core/utils/style';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@kijk/ui/components/accordion';
import { Button, buttonVariants } from '@kijk/ui/components/button';
import { Separator } from '@kijk/ui/components/separator';
import { Switch } from '@kijk/ui/components/switch';
import { useQuery } from '@tanstack/react-query';
import { ExternalLink } from 'lucide-react';
import { useForm } from 'react-hook-form';
import { toast } from 'sonner';
import { z } from 'zod';

import { useUpdateUser } from '@/app/settings/profile/use-update-user';
import { currentUserQueryOptions } from '@/shared/api/users/options';
import { AppVersion } from '@/shared/components/app-version';
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel } from '@/shared/components/form';
import { siteConfig } from '@/shared/config/site';
import { AnalyticsService } from '@/shared/lib/analytics-tracking';

const privacyFormSchema = z.object({
  enableAnalytics: z.boolean(),
});
type PrivacyFormValues = z.infer<typeof privacyFormSchema>;

export function InfoSection() {
  const { data: currentAccount } = useQuery(currentUserQueryOptions());
  const { mutate, isPending } = useUpdateUser();
  const form = useForm<PrivacyFormValues>({
    resolver: zodResolver(privacyFormSchema),
    values: {
      enableAnalytics: currentAccount?.user?.analyticsConsent === 'Accepted',
    },
  });

  function onSubmit(data: PrivacyFormValues) {
    const analyticsConsent = data.enableAnalytics ? 'Accepted' : 'Declined';
    mutate(
      { analyticsConsent },
      {
        onSuccess(updatedUser) {
          AnalyticsService.setCookieConsent(updatedUser.analyticsConsent === 'Accepted' ? 'accepted' : 'declined');
          toast('Privacy settings updated');
        },
      },
    );
  }

  return (
    <div className='space-y-6'>
      <div>
        <h3 className='text-lg font-medium'>Info</h3>
        <p className='text-muted-foreground text-sm'>App information and privacy settings.</p>
      </div>
      <Separator />
      <div className='flex flex-col gap-12'>
        <div className='flex items-center gap-4'>
          <div>Version: </div>
          <AppVersion className='text-muted-foreground' />
        </div>
        <Form {...form}>
          <form className='space-y-8' onSubmit={form.handleSubmit(onSubmit)}>
            <h3 className='mb-4 text-lg font-medium'>Privacy</h3>
            <FormField
              control={form.control}
              name='enableAnalytics'
              render={({ field }) => (
                <FormItem className='flex flex-row items-center justify-between rounded border p-4'>
                  <div className='space-y-0.5'>
                    <FormLabel className='text-base'>Share analytics and performance data</FormLabel>
                    <FormDescription>
                      Optional product analytics and sanitized Sentry router tracing help us understand feature usage
                      and navigation performance. Tracing starts only after consent, samples 10% of navigations, and
                      excludes route parameters and request tracing. Turning this off stops new performance traces.
                      Minimal technical error reports are separate and remain active so we can detect and fix problems.
                      They contain scrubbed diagnostics and a short-lived request correlation ID, not account IDs or
                      submitted household, resource or consumption values.{' '}
                      <a
                        className='text-foreground underline underline-offset-4'
                        href='/privacy'
                        rel='noopener noreferrer'
                        target='_blank'
                      >
                        Learn more in our Privacy Policy.
                      </a>
                    </FormDescription>
                  </div>
                  <FormControl>
                    <Switch checked={field.value} onCheckedChange={field.onChange} />
                  </FormControl>
                </FormItem>
              )}
            />
            <Button disabled={!form.formState.isDirty || isPending} type='submit'>
              Save
            </Button>
          </form>
        </Form>
        <div className='flex gap-4'>
          <a
            className={cn(buttonVariants({ variant: 'ghost' }), 'group gap-2')}
            href='/terms'
            rel='noopener noreferrer'
            target='_blank'
          >
            Terms of service
            <ExternalLink className='h-4 w-4' />
          </a>
          <a
            className={cn(buttonVariants({ variant: 'ghost' }), 'group gap-2')}
            href='/privacy'
            rel='noopener noreferrer'
            target='_blank'
          >
            Privacy Policy
            <ExternalLink className='h-4 w-4' />
          </a>
        </div>
        <Accordion collapsible type='single' className='w-full'>
          <AccordionItem value='data-deletion'>
            <AccordionTrigger>How can I request the deletion of my personal data?</AccordionTrigger>
            <AccordionContent>
              If you wish to have your personal data deleted from our systems in accordance with the &rsquo;Right to be
              Forgotten&rsquo; under GDPR or similar regulations, you can submit a request by contacting us through{' '}
              {siteConfig.email}. Once we verify your identity, we will proceed to remove your personal data from our
              active databases and stop further processing. You will receive a confirmation once the deletion is
              complete. Please note that certain data may be retained as required by law or for legitimate business
              purposes.
            </AccordionContent>
          </AccordionItem>
        </Accordion>
      </div>
    </div>
  );
}
