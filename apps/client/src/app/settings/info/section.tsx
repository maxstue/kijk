import { zodResolver } from '@hookform/resolvers/zod';
import { Button, buttonVariants } from '@kijk/ui/components/button';
import { Switch } from '@kijk/ui/components/switch';
import { useQuery } from '@tanstack/react-query';
import { cn } from 'cn';
import { ExternalLink } from 'lucide-react';
import { useForm } from 'react-hook-form';
import { toast } from 'sonner';
import { z } from 'zod';

import { DeleteAccount } from '@/app/settings/info/delete-account';
import { useUpdateUser } from '@/app/settings/profile/use-update-user';
import { currentUserQueryOptions } from '@/shared/api/users/options';
import { AppVersion } from '@/shared/components/app-version';
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel } from '@/shared/components/form';
import { PageHeader } from '@/shared/components/page-header';
import { AnalyticsService } from '@/shared/lib/analytics-tracking';

const privacyFormSchema = z.object({
  enableAi: z.boolean(),
  enableAnalytics: z.boolean(),
  sensitiveDataConsent: z.boolean(),
});
type PrivacyFormValues = z.infer<typeof privacyFormSchema>;

/** Info and privacy settings, including the analytics consent. */
export function InfoSection() {
  const { data: currentAccount } = useQuery(currentUserQueryOptions());
  const { mutate, isPending } = useUpdateUser();
  const form = useForm<PrivacyFormValues>({
    resolver: zodResolver(privacyFormSchema),
    values: {
      enableAi: currentAccount?.user?.aiEnabled ?? false,
      enableAnalytics: currentAccount?.user?.analyticsConsent === 'Accepted',
      sensitiveDataConsent: Boolean(currentAccount?.user?.sensitiveDataConsentAt),
    },
  });

  function onSubmit(data: PrivacyFormValues) {
    const analyticsConsent = data.enableAnalytics ? 'Accepted' : 'Declined';
    mutate(
      { aiEnabled: data.enableAi, analyticsConsent, sensitiveDataConsent: data.sensitiveDataConsent },
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
      <PageHeader title='Info' description='App information and privacy settings.' />
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
                      submitted space, resource or consumption values.{' '}
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
            <FormField
              control={form.control}
              name='enableAi'
              render={({ field }) => (
                <FormItem className='flex flex-row items-center justify-between rounded border p-4'>
                  <div className='space-y-0.5'>
                    <FormLabel className='text-base'>AI features</FormLabel>
                    <FormDescription>
                      Off by default. Turning it on is your consent to let Kijk suggest categories for imported
                      transactions with an AI provider; you still see and start every request yourself. When this is
                      off, Kijk never sends anything to an AI provider on your behalf, whatever the space setting says.
                    </FormDescription>
                  </div>
                  <FormControl>
                    <Switch checked={field.value} onCheckedChange={field.onChange} />
                  </FormControl>
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name='sensitiveDataConsent'
              render={({ field }) => (
                <FormItem className='flex flex-row items-center justify-between rounded border p-4'>
                  <div className='space-y-0.5'>
                    <FormLabel className='text-base'>Sensitive data in bank exports</FormLabel>
                    <FormDescription>
                      Your explicit consent (GDPR Article 9(2)(a)) to store and process bank transactions, which can
                      reveal sensitive information such as health, religion, political opinions or union membership.
                      Kijk only imports bank exports for you while this is on. Withdrawing it does not delete
                      transactions you already imported; delete them or your account if you want them gone.
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
          <a
            className={cn(buttonVariants({ variant: 'ghost' }), 'group gap-2')}
            href='/imprint'
            rel='noopener noreferrer'
            target='_blank'
          >
            Imprint
            <ExternalLink className='h-4 w-4' />
          </a>
        </div>
        <DeleteAccount />
      </div>
    </div>
  );
}
