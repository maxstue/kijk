import { RadioGroup } from '@kijk/ui/components/radio-group';
import { useForm } from 'react-hook-form';

import type { UserStepFormDraft } from '@/app/welcome/schemas';
import { FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from '@/shared/components/form';

import { Choice } from './choice';

interface PrivacyStepProps {
  control: ReturnType<typeof useForm<UserStepFormDraft>>['control'];
}

export function PrivacyStep({ control }: PrivacyStepProps) {
  return (
    <div className='space-y-5'>
      <FormField
        control={control}
        name='analyticsConsent'
        render={({ field }) => (
          <FormItem>
            <FormLabel>Help improve Kijk</FormLabel>
            <FormDescription>
              Usage and route-performance data is optional and helps us understand which features are useful and where
              Kijk can be improved. Router tracing (Sentry and PostHog) starts only after you accept and uses a 10%
              sample without route parameters or request tracing. Minimal technical error reports are processed
              separately and remain active so we can detect and fix problems. They contain scrubbed diagnostics and a
              short-lived request correlation ID, not account IDs or submitted space, resource or consumption values.{' '}
              <a
                className='text-foreground underline underline-offset-4'
                href='/privacy'
                rel='noopener noreferrer'
                target='_blank'
              >
                Learn more in our Privacy Policy.
              </a>
            </FormDescription>
            <FormControl>
              <RadioGroup className='grid gap-3 pt-2' value={field.value ?? ''} onValueChange={field.onChange}>
                <Choice
                  value='Accepted'
                  title='Share usage and performance data'
                  description='Send optional product analytics and sanitized route-performance measurements.'
                />
                <Choice
                  value='Declined'
                  title='Do not share'
                  description='Do not send optional analytics or tracing.'
                />
              </RadioGroup>
            </FormControl>
            <FormMessage />
          </FormItem>
        )}
      />
    </div>
  );
}
