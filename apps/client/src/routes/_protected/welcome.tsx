import { useCallback, useState } from 'react';
import { createFileRoute, useNavigate } from '@tanstack/react-router';

import { userSignInQuery } from '@/app/root/use-signin-user';
import { UserStepFormValues } from '@/app/welcome/schemas';
import { useInitUser } from '@/app/welcome/use-init-user';
import { UserStepForm } from '@/app/welcome/user-step-form';
import { AppError } from '@/shared/components/errors/app-error';
import { Head } from '@/shared/components/head';
import { ThemeQuickCustomizer } from '@/shared/components/theme-quick-customizer';
import { Button } from '@/shared/components/ui/button';
import { Step, StepConfig, Steps } from '@/shared/components/ui/stepper';
import { useStepper } from '@/shared/hooks/use-stepper';
import { queryClient } from '@/shared/lib/query-client';
import { useAuthStore } from '@/shared/stores/auth-store';
import { User_Metadata } from '@/shared/types/app';

export const Route = createFileRoute('/_protected/welcome')({
  beforeLoad: async ({ navigate }) => {
    const data = await queryClient.ensureQueryData(userSignInQuery);
    if (data.data?.firstTime == false) {
      void navigate({ to: '/home' });
    }
  },
  component: WelcomePage,
  errorComponent: AppError,
});

const steps = [{ label: 'Welcome' }, { label: 'User' }, { label: 'Theme' }, { label: 'Finish' }] satisfies StepConfig[];

function WelcomePage() {
  const { session } = useAuthStore();
  const [userStep, setUserStep] = useState<UserStepFormValues>({
    userName: (session?.user?.user_metadata as User_Metadata).user_name ?? '',
    useDefaultCategories: true,
  });
  const navigate = useNavigate({ from: '/' });
  const { mutate } = useInitUser();
  const { nextStep, prevStep, activeStep, isDisabledStep, isLastStep, isOptionalStep } = useStepper({
    initialStep: 0,
    steps,
  });

  const handleFinish = useCallback(() => {
    mutate(userStep, {
      async onSuccess() {
        await navigate({ to: '/', replace: true });
      },
    });
  }, [mutate, navigate, userStep]);

  return (
    <>
      <Head title='Welcome' />
      <div className='flex h-[100dvh] w-full items-center justify-center'>
        <div className='flex w-3/5 flex-col gap-6'>
          <Steps activeStep={activeStep} className='px-24'>
            {steps.map((step, index) => (
              <Step index={index} key={index} {...step}>
                <div className='flex h-[calc(100dvh_*_0.5)] w-full flex-col bg-muted p-6'>
                  {index === 0 && <StepZero />}
                  {index === 1 && <StepOne value={userStep} setuserStep={setUserStep} />}
                  {index === 2 && <StepTwo />}
                  {index === 3 && <Finish />}
                </div>
              </Step>
            ))}
          </Steps>
          <div className='flex items-center justify-end'>
            <div className='flex w-1/4 gap-2'>
              <Button onClick={prevStep} disabled={isDisabledStep} className='w-full'>
                Prev
              </Button>
              {!isLastStep && (
                <Button onClick={nextStep} className='w-full'>
                  {isOptionalStep ? 'Skip' : 'Next'}
                </Button>
              )}
              {isLastStep && (
                <Button onClick={handleFinish} className='w-full'>
                  Finish
                </Button>
              )}
            </div>
          </div>
        </div>
      </div>
    </>
  );
}

function StepZero() {
  return (
    <div className='flex h-full flex-col items-center justify-start gap-12 pt-6'>
      <div className='text-2xl'>
        Welcome to &apos;<span className='text-bold text-primary'>Kijk</span>&apos; your personal household planner.
      </div>
      <div className='w-2/3 text-muted-foreground'>
        <p>The app helps you to monitor your income, expenditure and energy costs faster and more clearly.</p>
        <p>So you don&apos;t have to struggle with large spreadsheets or buy expensive apps.</p>
      </div>
      <p className='w-2/3 text-muted-foreground'>
        If you have any questions, ideas, feedback or just want to say hello, just drop by at our{' '}
        <a href='https://github.com/maxstue/kijk/discussions' className='cursor-pointer underline decoration-primary'>
          github
        </a>
        . 🙂
      </p>
    </div>
  );
}

function StepOne({
  value,
  setuserStep,
}: {
  value: UserStepFormValues;
  setuserStep: (data: UserStepFormValues) => void;
}) {
  return (
    <div className='flex h-full flex-col items-center justify-start gap-12 pt-6'>
      <div className='text-2xl'>User setup</div>
      <div className='flex w-2/3 flex-col items-center justify-end gap-4'>
        <div className='text-muted-foreground'>Setup your username and categories</div>
        <div className='text-muted-foreground'>You can change this setting at a later date in you profile.</div>
      </div>
      <UserStepForm value={value} onNext={setuserStep} className='w-2/3' />
    </div>
  );
}

function StepTwo() {
  return (
    <div className='flex h-full flex-col items-center justify-start gap-12 pt-6'>
      <div className='text-2xl'>Theme customization</div>
      <div className='flex w-2/3 flex-col items-center justify-end gap-4'>
        <div className='text-muted-foreground'>Pick a style and color from a preset.</div>
        <div className='text-muted-foreground'> You can change this setting at a later date in you profile.</div>
      </div>
      <ThemeQuickCustomizer />
    </div>
  );
}

function Finish() {
  return (
    <div className='flex h-full flex-col items-center justify-center gap-12'>
      <div className='text-2xl'>And now enjoy using the app !! 🚀 😀</div>
    </div>
  );
}
