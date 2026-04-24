import { zodResolver } from '@hookform/resolvers/zod';
import { browserStorage } from '@kijk/core/lib/browser-storage';
import { cn } from '@kijk/core/utils/style';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@kijk/ui/components/accordion';
import { Button, buttonVariants } from '@kijk/ui/components/button';
import { Separator } from '@kijk/ui/components/separator';
import { Switch } from '@kijk/ui/components/switch';
import { ExternalLink } from 'lucide-react';
import { useForm } from 'react-hook-form';
import { toast } from 'sonner';
import { z } from 'zod';

import { AppVersion } from '@/shared/components/app-version';
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel } from '@/shared/components/form';
import { config } from '@/shared/config';
import { AnalyticsService } from '@/shared/lib/analytics-client';
import { siteConfig } from '@/shared/lib/constants';
import type { CookieConsent } from '@/shared/types/app';
import { COOKIE_CONSENT_KEY } from '@/shared/types/app';

const getCookieConsent = () => {
  if (browserStorage.hasItem(COOKIE_CONSENT_KEY)) {
    return browserStorage.getItem<CookieConsent>(COOKIE_CONSENT_KEY) == 'accepted';
  }
  return false;
};

function onSubmit(data: PrivacyFormValues) {
  if (data.enable_analytics) {
    browserStorage.setItem(COOKIE_CONSENT_KEY, 'accepted');
    AnalyticsService.getInstance().opt_in_capturing();
  }
  if (!data.enable_analytics) {
    browserStorage.setItem(COOKIE_CONSENT_KEY, 'declined');
    AnalyticsService.getInstance().opt_out_capturing();
  }

  toast('Privacy settings updated');
}

const privacyFormSchema = z.object({
  enable_analytics: z.boolean().optional().default(getCookieConsent()),
});
type PrivacyFormValues = z.infer<typeof privacyFormSchema>;

const defaultValues: Partial<PrivacyFormValues> = {
  enable_analytics: getCookieConsent(),
};

export function InfoSection() {
  const form = useForm({
    defaultValues,
    resolver: zodResolver(privacyFormSchema),
  });

  return (
    <div className='space-y-6'>
      <div>
        <h3 className='text-lg font-medium'>Info</h3>
        <p className='text-muted-foreground text-sm'>Here are some informations about this app and privacy settings.</p>
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
            <div className='space-y-4'>
              <FormField
                control={form.control}
                name='enable_analytics'
                render={({ field }) => (
                  <FormItem className='flex flex-row items-center justify-between rounded border p-4'>
                    <div className='space-y-0.5'>
                      <FormLabel className='text-base'>Analytics</FormLabel>
                      <FormDescription>
                        Enable cookies to enhance your experience. We use them to analyze site traffic. Rest assured,
                        all data collected is anonymized.
                      </FormDescription>
                    </div>
                    <FormControl>
                      <Switch checked={field.value} onCheckedChange={field.onChange} />
                    </FormControl>
                  </FormItem>
                )}
              />
            </div>
            <Button type='submit'>Save</Button>
          </form>
        </Form>
        <div className='flex gap-4'>
          <a
            className={cn(buttonVariants({ variant: 'ghost' }), 'group gap-2')}
            href={`${config.WebUrl}/terms`}
            rel='noopener noreferrer'
            target='_blank'
          >
            Terms of service
            <ExternalLink className='h-4 w-4' />
          </a>
          <a
            className={cn(buttonVariants({ variant: 'ghost' }), 'group gap-2')}
            href={`${config.WebUrl}/privacy`}
            rel='noopener noreferrer'
            target='_blank'
          >
            Privacy Policy
            <ExternalLink className='h-4 w-4' />
          </a>
        </div>
        <div>
          <Accordion collapsible type='single' className='w-full'>
            <AccordionItem value='item-1'>
              <AccordionTrigger>How can I request the deletion of my personal data ?</AccordionTrigger>
              <AccordionContent>
                If you wish to have your personal data deleted from our systems in accordance with the &rsquo;Right to
                be Forgotten&rsquo; under GDPR or similar regulations, you can submit a request by contacting us through{' '}
                {siteConfig.email}. Once we verify your identity, we will proceed to remove your personal data from our
                active databases and stop further processing. You will receive a confirmation once the deletion is
                complete. Please note that certain data may be retained as required by law or for legitimate business
                purposes.
              </AccordionContent>
            </AccordionItem>
          </Accordion>
        </div>
      </div>
    </div>
  );
}
