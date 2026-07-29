import { zodResolver } from '@hookform/resolvers/zod';
import { Button } from '@kijk/ui/components/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@kijk/ui/components/card';
import { Input } from '@kijk/ui/components/input';
import { RadioGroup, RadioGroupItem } from '@kijk/ui/components/radio-group';
import {
  Stepper,
  StepperContent,
  StepperIndicator,
  StepperItem,
  StepperLabel,
  StepperList,
  StepperNext,
  StepperPrevious,
  StepperTrigger,
} from '@kijk/ui/components/stepper';
import { LoaderCircle } from 'lucide-react';
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
import { useSignInProviderName } from '@/shared/hooks/use-sign-in-provider-name';
import { ApiError } from '@/shared/types/errors/api-error';

const steps = [
  { label: 'Profile', value: 'profile' },
  { label: 'Household', value: 'household' },
  { label: 'Privacy', value: 'privacy' },
  { label: 'Review', value: 'review' },
] as const;
const stepOrder = steps.map(({ value }) => ({ value }));
const stepContentClassName =
  'col-start-1 row-start-1 border-0 bg-transparent p-0 shadow-none data-[state=inactive]:invisible';

type StepValue = (typeof steps)[number]['value'];

interface WelcomeFlowProps {
  email?: string | null;
  fullName?: string | null;
  householdName: string;
  imageUrl?: string | null;
  initialDisplayName: string;
  onComplete: () => Promise<void>;
}

// TODO  make it a bit more beautiful, so it looks more like a shadcn component. (How do shadcn stepper look like ?)
// TODO update profile, wenn man "use signin profile" abwählt, "Analytics Consent' darf kein Nullwert sein. "
// TODO if an BE error occurs during signin or getMe, the cookie consent popup still shows up, but it would be better to only show it afters successful signin and getMe.
// TODO change shadcn theme to "pnpm dlx shadcn@latest apply --preset b5LCAabVg"
export function WelcomeFlow({
  email,
  fullName,
  householdName,
  imageUrl,
  initialDisplayName,
  onComplete,
}: WelcomeFlowProps) {
  const [currentStep, setCurrentStep] = useState<StepValue>('profile');
  const currentStepIndex = steps.findIndex(({ value }) => value === currentStep);
  const { providerName } = useSignInProviderName();
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
      <Stepper className='gap-5' steps={stepOrder} value={currentStep} onValueChange={(value) => setCurrentStep(value)}>
        <div className='space-y-3'>
          <div className='flex items-center justify-between text-sm'>
            <span className='font-medium'>
              Step {currentStepIndex + 1} of {steps.length}
            </span>
            <span className='text-muted-foreground'>{steps[currentStepIndex]?.label}</span>
          </div>
          <StepperList>
            {steps.map((step, index) => (
              <StepperItem
                key={step.value}
                completed={index < currentStepIndex}
                defaultTrigger={false}
                value={step.value}
              >
                <StepperTrigger disabled={index > currentStepIndex}>
                  <StepperIndicator />
                  <StepperLabel>{step.label}</StepperLabel>
                </StepperTrigger>
              </StepperItem>
            ))}
          </StepperList>
        </div>

        <Card>
          <div className='grid'>
            {steps.map((step, index) => {
              const isActive = currentStep === step.value;

              return (
                <CardHeader
                  key={step.value}
                  aria-hidden={!isActive}
                  className={`col-start-1 row-start-1 ${isActive ? '' : 'invisible'}`}
                  inert={!isActive}
                >
                  <CardTitle>{stepTitle(index)}</CardTitle>
                  <CardDescription>{stepDescription(index)}</CardDescription>
                </CardHeader>
              );
            })}
          </div>
          <CardContent>
            <Form {...form}>
              <form className='space-y-6' onSubmit={form.handleSubmit(submit)}>
                <div className='grid'>
                  <StepperContent preserveLayout className={stepContentClassName} value='profile'>
                    <ProfileStep
                      providerName={providerName}
                      control={form.control}
                      email={email}
                      fullName={fullName}
                      imageUrl={imageUrl}
                    />
                  </StepperContent>
                  <StepperContent preserveLayout className={stepContentClassName} value='household'>
                    <HouseholdStep control={form.control} />
                  </StepperContent>
                  <StepperContent preserveLayout className={stepContentClassName} value='privacy'>
                    <PrivacyStep control={form.control} />
                  </StepperContent>
                  <StepperContent preserveLayout className={stepContentClassName} value='review'>
                    <ReviewStep values={form.getValues()} />
                  </StepperContent>
                </div>

                <div className='flex justify-between gap-3 pt-2'>
                  <StepperPrevious asChild disabled={isPending}>
                    <Button type='button' variant='secondary'>
                      Back
                    </Button>
                  </StepperPrevious>
                  {currentStep === 'review' ? (
                    <Button disabled={isPending} type='submit'>
                      {isPending && <LoaderCircle className='animate-spin' />}
                      Finish setup
                    </Button>
                  ) : (
                    <StepperNext asChild onBeforeNext={() => validateStep(form, currentStepIndex)}>
                      <Button type='button'>Continue</Button>
                    </StepperNext>
                  )}
                </div>
              </form>
            </Form>
          </CardContent>
        </Card>
      </Stepper>
    </main>
  );
}

function ProfileStep({
  providerName,
  control,
  email,
  fullName,
  imageUrl,
}: Pick<WelcomeFlowProps, 'email' | 'fullName' | 'imageUrl'> & {
  providerName: string;
  control: ReturnType<typeof useForm<UserStepFormDraft>>['control'];
}) {
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
                value={field.value === null ? '' : field.value ? 'yes' : 'no'}
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

function validateStep(form: UseFormReturn<UserStepFormDraft, unknown, UserStepFormValues>, currentStep: number) {
  const fieldsByStep = [
    ['displayName', 'useExternalProfile'],
    ['householdName', 'useDefaultResources'],
    ['analyticsConsent'],
  ] satisfies Array<Array<keyof UserStepFormDraft>>;
  const fields = fieldsByStep[currentStep];

  return form.trigger(fields, { shouldFocus: true });
}
