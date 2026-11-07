import { zodResolver } from '@hookform/resolvers/zod';
import * as usersOptions from '@kijk/api/users/options';
import { Button } from '@kijk/ui/components/button';
import { useMutation, useQuery } from '@tanstack/react-query';
import { useForm } from 'react-hook-form';
import { toast } from 'sonner';
import { z } from 'zod';

import { Form } from '@/shared/components/form';
import { AnalyticsService } from '@/shared/lib/analytics-tracking';

import { PrivacyFields } from './privacy-fields';

const privacyFormSchema = z.object({
  enableAi: z.boolean(),
  enableAnalytics: z.boolean(),
  sensitiveDataConsent: z.boolean(),
});
export type PrivacyFormValues = z.infer<typeof privacyFormSchema>;

export function PrivacyForm() {
  const { data: currentAccount } = useQuery(usersOptions.meQueryOptions());
  const { mutate, isPending } = useMutation(usersOptions.updateMutationOptions());
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
    <Form {...form}>
      <form className='space-y-8' onSubmit={form.handleSubmit(onSubmit)}>
        <h3 className='mb-4 text-lg font-medium'>Privacy</h3>
        <PrivacyFields control={form.control} />
        <Button disabled={!form.formState.isDirty || isPending} type='submit'>
          Save
        </Button>
      </form>
    </Form>
  );
}
