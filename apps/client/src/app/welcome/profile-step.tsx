import { Input } from '@kijk/ui/components/input';
import { RadioGroup } from '@kijk/ui/components/radio-group';
import { useForm } from 'react-hook-form';

import type { UserStepFormDraft } from '@/app/welcome/schemas';
import { AuthIdentitySummary } from '@/shared/components/auth-identity-summary';
import { FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from '@/shared/components/form';

import { Choice } from './choice';

function getProfileChoiceValue(value: boolean | null) {
  if (value === null) {
    return '';
  }

  return value ? 'yes' : 'no';
}

interface ProfileStepProps {
  email?: string | null;
  fullName?: string | null;
  imageUrl?: string | null;
  providerName: string;
  control: ReturnType<typeof useForm<UserStepFormDraft>>['control'];
}

export function ProfileStep({ providerName, control, email, fullName, imageUrl }: ProfileStepProps) {
  return (
    <div className='space-y-6'>
      <AuthIdentitySummary email={email} fullName={fullName} imageUrl={imageUrl} provider={providerName} />
      <FormField
        control={control}
        name='useExternalProfile'
        render={({ field }) => (
          <FormItem>
            <FormLabel>Use your sign-in profile in Kijk?</FormLabel>
            <FormDescription>
              Your full name and profile image stay managed by your {providerName} account. Kijk only uses them when you
              choose to. You can change this later in your profile settings.
            </FormDescription>
            <FormControl>
              <RadioGroup
                className='grid gap-3 pt-2 sm:grid-cols-2'
                value={getProfileChoiceValue(field.value)}
                onValueChange={(value) => field.onChange(value === 'yes')}
              >
                <Choice
                  value='yes'
                  title='Use profile'
                  description={`Show the full name and profile image from your ${providerName} account in Kijk.`}
                />
                <Choice
                  value='no'
                  title='Do not use'
                  description='Use only your Kijk username and a generated avatar.'
                />
              </RadioGroup>
            </FormControl>
            <FormMessage />
          </FormItem>
        )}
      />
      <FormField
        control={control}
        name='displayName'
        render={({ field }) => (
          <FormItem>
            <FormLabel>Username</FormLabel>
            <FormControl>
              <Input autoComplete='name' placeholder='Your name' {...field} />
            </FormControl>
            <FormDescription>This is how your name appears in Kijk. It does not affect sign-in.</FormDescription>
            <FormMessage />
          </FormItem>
        )}
      />
    </div>
  );
}
