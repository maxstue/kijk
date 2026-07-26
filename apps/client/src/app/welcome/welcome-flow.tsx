'use no memo';

import { zodResolver } from '@hookform/resolvers/zod';
import { Button } from '@kijk/ui/components/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@kijk/ui/components/card';
import { Input } from '@kijk/ui/components/input';
import { Progress } from '@kijk/ui/components/progress';
import { RadioGroup, RadioGroupItem } from '@kijk/ui/components/radio-group';
import { Check, LoaderCircle } from 'lucide-react';
import { useState } from 'react';
import type { UseFormReturn } from 'react-hook-form';
import { useForm } from 'react-hook-form';
import { toast } from 'sonner';

import type { UserStepFormDraft, UserStepFormValues } from '@/app/welcome/schemas';
import { userStepSchema } from '@/app/welcome/schemas';
import { useWelcomeUser } from '@/app/welcome/use-welcome-user';
import { AuthIdentitySummary } from '@/shared/components/auth-identity-summary';
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/shared/components/form';
import { config } from '@/shared/config';
import { ApiError } from '@/shared/types/errors/api-error';

const steps = ['Profile', 'Household', 'Privacy', 'Review'] as const;

interface WelcomeFlowProps {
  authProvider: string;
  email?: string | null;
  fullName?: string | null;
  householdName: string;
  imageUrl?: string | null;
  initialDisplayName: string;
  onComplete: () => Promise<void>;
  signInSourceLabel: string;
}

export function WelcomeFlow({
  authProvider,
  email,
  fullName,
  householdName,
  imageUrl,
  initialDisplayName,
  onComplete,
  signInSourceLabel,
}: WelcomeFlowProps) {
  const [currentStep, setCurrentStep] = useState(0);
  const { mutateAsync, isPending } = useWelcomeUser();
  const form = useForm<UserStepFormDraft, unknown, UserStepFormValues>({
    defaultValues: {
      analyticsConsent: null,
      displayName: initialDisplayName,
      householdName,
      useDefaultResources: true,
      useExternalProfile: null,
    },
    resolver: zodResolver(userStepSchema),
  });

  async function next() {
    if (!(await validateStep(form, currentStep))) {
      return;
    }

    setCurrentStep((step) => Math.min(step + 1, steps.length - 1));
  }

  async function submit(values: UserStepFormValues) {
    try {
      await mutateAsync(values);
      await onComplete();
    } catch (error) {
      toast('An error occurred while completing your setup.', {
        description: ApiError.isApiError(error) ? error.getErrorsString() : 'Please try again.',
      });
    }
  }

  return (
    <main className='mx-auto flex min-h-full w-full max-w-3xl flex-col justify-center gap-5 px-4 py-8'>
      <div className='space-y-3'>
        <div className='flex items-center justify-between text-sm'>
          <span className='font-medium'>
            Step {currentStep + 1} of {steps.length}
          </span>
          <span className='text-muted-foreground'>{steps[currentStep]}</span>
        </div>
        <Progress value={((currentStep + 1) / steps.length) * 100} />
        <ol className='grid grid-cols-4 gap-2' aria-label='Onboarding progress'>
          {steps.map((step, index) => (
            <li
              key={step}
              className='text-muted-foreground flex items-center gap-1.5 text-xs'
              aria-current={index === currentStep ? 'step' : undefined}
            >
              <span
                className={`flex size-5 items-center justify-center rounded-full border ${
                  index <= currentStep ? 'border-primary bg-primary text-primary-foreground' : ''
                }`}
              >
                {index < currentStep ? <Check className='size-3' /> : index + 1}
              </span>
              <span className='hidden sm:inline'>{step}</span>
            </li>
          ))}
        </ol>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>{stepTitle(currentStep)}</CardTitle>
          <CardDescription>{stepDescription(currentStep)}</CardDescription>
        </CardHeader>
        <CardContent>
          <Form {...form}>
            <form className='space-y-6' onSubmit={form.handleSubmit(submit)}>
              {currentStep === 0 && (
                <ProfileStep
                  authProvider={authProvider}
                  control={form.control}
                  email={email}
                  fullName={fullName}
                  imageUrl={imageUrl}
                  signInSourceLabel={signInSourceLabel}
                />
              )}
              {currentStep === 1 && <HouseholdStep control={form.control} />}
              {currentStep === 2 && <PrivacyStep control={form.control} />}
              {currentStep === 3 && <ReviewStep values={form.getValues()} />}

              <div className='flex justify-between gap-3 pt-2'>
                <Button
                  disabled={currentStep === 0 || isPending}
                  type='button'
                  variant='secondary'
                  onClick={() => setCurrentStep((step) => Math.max(0, step - 1))}
                >
                  Back
                </Button>
                {currentStep === steps.length - 1 ? (
                  <Button disabled={isPending} type='submit'>
                    {isPending && <LoaderCircle className='animate-spin' />}
                    Finish setup
                  </Button>
                ) : (
                  <Button type='button' onClick={next}>
                    Continue
                  </Button>
                )}
              </div>
            </form>
          </Form>
        </CardContent>
      </Card>
    </main>
  );
}

function ProfileStep({
  authProvider,
  control,
  email,
  fullName,
  imageUrl,
  signInSourceLabel,
}: Pick<WelcomeFlowProps, 'authProvider' | 'email' | 'fullName' | 'imageUrl' | 'signInSourceLabel'> & {
  control: ReturnType<typeof useForm<UserStepFormDraft>>['control'];
}) {
  return (
    <div className='space-y-6'>
      <AuthIdentitySummary email={email} fullName={fullName} imageUrl={imageUrl} provider={authProvider} />
      <FormField
        control={control}
        name='useExternalProfile'
        render={({ field }) => (
          <FormItem>
            <FormLabel>Use your sign-in profile in Kijk?</FormLabel>
            <FormDescription>
              Your full name and profile image stay managed by your {signInSourceLabel}. Kijk only uses them when you
              choose to. You can change this later in your profile settings.
            </FormDescription>
            <FormControl>
              <RadioGroup
                className='grid gap-3 pt-2 sm:grid-cols-2'
                value={field.value === null ? '' : field.value ? 'yes' : 'no'}
                onValueChange={(value) => field.onChange(value === 'yes')}
              >
                <Choice
                  value='yes'
                  title='Use profile'
                  description={`Show the full name and profile image from your ${signInSourceLabel} in Kijk.`}
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

function HouseholdStep({ control }: { control: ReturnType<typeof useForm<UserStepFormDraft>>['control'] }) {
  return (
    <div className='space-y-6'>
      <FormField
        control={control}
        name='householdName'
        render={({ field }) => (
          <FormItem>
            <FormLabel>Household name</FormLabel>
            <FormControl>
              <Input placeholder='My household' {...field} />
            </FormControl>
            <FormDescription>You can invite other household members later.</FormDescription>
            <FormMessage />
          </FormItem>
        )}
      />
      <FormField
        control={control}
        name='useDefaultResources'
        render={({ field }) => (
          <FormItem>
            <FormLabel>Resource types</FormLabel>
            <FormDescription>Start with every default resource type or with none.</FormDescription>
            <FormControl>
              <RadioGroup
                className='grid gap-3 pt-2 sm:grid-cols-2'
                value={field.value ? 'all' : 'none'}
                onValueChange={(value) => field.onChange(value === 'all')}
              >
                <Choice value='all' title='All defaults' description='Electricity, water, gas and other defaults.' />
                <Choice value='none' title='No defaults' description='Start empty and add resources yourself.' />
              </RadioGroup>
            </FormControl>
            <FormMessage />
          </FormItem>
        )}
      />
    </div>
  );
}

function Choice({ description, title, value }: { description: string; title: string; value: string }) {
  return (
    <FormItem className='has-data-[state=checked]:border-primary flex items-start gap-3 rounded-lg border p-4'>
      <FormControl>
        <RadioGroupItem value={value} />
      </FormControl>
      <FormLabel className='block font-normal'>
        <span className='font-medium'>{title}</span>
        <span className='text-muted-foreground mt-1 block text-sm'>{description}</span>
      </FormLabel>
    </FormItem>
  );
}

function PrivacyStep({ control }: { control: ReturnType<typeof useForm<UserStepFormDraft>>['control'] }) {
  return (
    <div className='space-y-5'>
      <FormField
        control={control}
        name='analyticsConsent'
        render={({ field }) => (
          <FormItem>
            <FormLabel>Help improve Kijk</FormLabel>
            <FormDescription>
              Usage data is optional and helps us understand which features are useful and where Kijk can be improved.
              Technical error reports are always active so we can detect and fix problems. These reports do not include
              user-specific information.{' '}
              <a
                className='text-foreground underline underline-offset-4'
                href={`${config.WebUrl}/privacy`}
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
                  title='Share usage data'
                  description='Send optional usage data to help improve Kijk.'
                />
                <Choice value='Declined' title='Do not share' description='Do not send optional usage data.' />
              </RadioGroup>
            </FormControl>
            <FormMessage />
          </FormItem>
        )}
      />
    </div>
  );
}

function ReviewStep({ values }: { values: UserStepFormDraft }) {
  return (
    <dl className='divide-y rounded-lg border'>
      <ReviewItem label='Username' value={values.displayName} />
      <ReviewItem label='Sign-in profile' value={values.useExternalProfile ? 'Name and image used' : 'Not used'} />
      <ReviewItem label='Household' value={values.householdName} />
      <ReviewItem label='Default resources' value={values.useDefaultResources ? 'All defaults' : 'None'} />
      <ReviewItem label='Usage data' value={values.analyticsConsent === 'Accepted' ? 'Shared' : 'Not shared'} />
    </dl>
  );
}

function ReviewItem({ label, value }: { label: string; value: string }) {
  return (
    <div className='grid gap-1 px-4 py-3 sm:grid-cols-2'>
      <dt className='text-muted-foreground text-sm'>{label}</dt>
      <dd className='font-medium sm:text-right'>{value}</dd>
    </div>
  );
}

function stepTitle(step: number) {
  return ['Welcome to Kijk', 'Set up your household', 'Choose your privacy settings', 'Review your setup'][step];
}

function stepDescription(step: number) {
  return [
    'Confirm the profile information connected to your account.',
    'Choose a name and whether to add all default resource types.',
    'Choose whether to share optional usage data to help improve Kijk.',
    'Everything can be changed later in settings.',
  ][step];
}

async function validateStep(form: UseFormReturn<UserStepFormDraft, unknown, UserStepFormValues>, currentStep: number) {
  const fieldsByStep = [
    ['displayName', 'useExternalProfile'],
    ['householdName', 'useDefaultResources'],
    ['analyticsConsent'],
  ] satisfies Array<Array<keyof UserStepFormDraft>>;
  const fields = fieldsByStep[currentStep];

  return fields ? form.trigger(fields, { shouldFocus: true }) : true;
}
