import { zodResolver } from '@hookform/resolvers/zod';
import { ApiError } from '@kijk/api/errors';
import { Button } from '@kijk/ui/components/button';
import { Card, CardContent } from '@kijk/ui/components/card';
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
import { useForm } from 'react-hook-form';
import { toast } from 'sonner';

import type { UserStepFormDraft, UserStepFormValues } from '@/app/welcome/schemas';
import { userStepSchema } from '@/app/welcome/schemas';
import { useWelcomeUser } from '@/app/welcome/use-welcome-user';
import { AppBrand } from '@/shared/components/app-brand';
import { Form } from '@/shared/components/form';
import { useSignInProviderName } from '@/shared/hooks/use-sign-in-provider-name';

import { PrivacyStep } from './privacy-step';
import { ProfileStep } from './profile-step';
import { ReviewStep } from './review-step';
import { SpaceStep } from './space-step';
import { WelcomeStepHeader } from './step-header';
import { steps, stepOrder, type StepValue, validateStep } from './steps';

interface WelcomeFlowProps {
  email?: string | null;
  fullName?: string | null;
  spaceName?: string;
  imageUrl?: string | null;
  initialDisplayName: string;
  onComplete: () => Promise<void>;
}

/** Multi-step onboarding: profile, space, privacy and review; calls `onComplete` when done. */
export function WelcomeFlow({
  email,
  fullName,
  spaceName,
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
      spaceName,
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
      <AppBrand className='justify-center' logoClassName='size-8' nameClassName='text-xl' />
      <Stepper className='gap-5' steps={stepOrder} value={currentStep} onValueChange={(value) => setCurrentStep(value)}>
        <div className='space-y-3'>
          <StepperList>
            {steps.map((step, index) => (
              <StepperItem key={step.value} completed={index < currentStepIndex} value={step.value}>
                <StepperTrigger disabled={index > currentStepIndex}>
                  <StepperIndicator />
                  <StepperLabel>{step.label}</StepperLabel>
                </StepperTrigger>
              </StepperItem>
            ))}
          </StepperList>
        </div>

        <Card>
          <WelcomeStepHeader currentStep={currentStep} />
          <CardContent>
            <Form {...form}>
              <form className='space-y-6' onSubmit={form.handleSubmit(submit)}>
                <div className='grid'>
                  <StepperContent preserveLayout className='col-start-1 row-start-1' value='profile'>
                    <ProfileStep
                      providerName={providerName}
                      control={form.control}
                      email={email}
                      fullName={fullName}
                      imageUrl={imageUrl}
                    />
                  </StepperContent>
                  <StepperContent preserveLayout className='col-start-1 row-start-1' value='space'>
                    <SpaceStep control={form.control} />
                  </StepperContent>
                  <StepperContent preserveLayout className='col-start-1 row-start-1' value='privacy'>
                    <PrivacyStep control={form.control} />
                  </StepperContent>
                  <StepperContent preserveLayout className='col-start-1 row-start-1' value='review'>
                    <ReviewStep />
                  </StepperContent>
                </div>

                <div className='flex justify-between gap-3 pt-2'>
                  {currentStep !== 'profile' && (
                    <StepperPrevious variant='secondary' disabled={isPending}>
                      Back
                    </StepperPrevious>
                  )}
                  {currentStep === 'review' ? (
                    <Button className='ml-auto' disabled={isPending} type='submit'>
                      {isPending && <LoaderCircle className='animate-spin' />}
                      Finish setup
                    </Button>
                  ) : (
                    <StepperNext className='ml-auto' onBeforeNext={() => validateStep(form, currentStepIndex)}>
                      Continue
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
