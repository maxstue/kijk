import { useCallback, useEffect, useState } from 'react';
import { useUser } from '@clerk/clerk-react';
import { createFileRoute, redirect, useNavigate } from '@tanstack/react-router';
import { toast } from 'sonner';

import type { UserStepFormValues } from '@/app/welcome/schemas';
import type { CarouselApi } from '@/shared/components/ui/carousel';
import { userSignInQuery } from '@/app/root/use-signin-user';
import { useWelcomeUser } from '@/app/welcome/use-welcome-user';
import { UserStepForm } from '@/app/welcome/user-step-form';
import { Button } from '@/shared/components/ui/button';
import { Card, CardContent } from '@/shared/components/ui/card';
import { Carousel, CarouselContent, CarouselItem } from '@/shared/components/ui/carousel';
import { InitLoader } from '@/shared/components/ui/loaders/init-loader';
import { Progress } from '@/shared/components/ui/progress';
import { stringIsNotEmptyOrWhitespace } from '@/shared/utils/string';
import { useSetSiteHeader } from '@/shared/hooks/use-set-site-header';

export const Route = createFileRoute('/welcome')({
  beforeLoad: async ({ context: { authClient, queryClient } }) => {
    const session = authClient?.session;
    const sessionToken = await session?.getToken();
    if (!stringIsNotEmptyOrWhitespace(sessionToken)) {
      throw redirect({ to: '/auth', search: { from: location.href } });
    }

    const user = await queryClient.ensureQueryData(userSignInQuery);
    if (user.firstTime == false) {
      throw redirect({ to: '/home', replace: true });
    }
  },
  pendingComponent: InitLoader,
  component: WelcomePage,
});

const steps = [{ label: 'Welcome' }, { label: 'User' }, { label: 'Finish' }];

function WelcomePage() {
  useSetSiteHeader('Welcome');
  const { user } = useUser();
  const [userStep, setUserStep] = useState<UserStepFormValues>({
    userName: user?.username ?? '',
    useDefaultResources: true,
  });
  const [api, setApi] = useState<CarouselApi>();
  const [current, setCurrent] = useState(0);

  useEffect(() => {
    if (!api) {
      return;
    }

    setCurrent(api.selectedScrollSnap() + 1);

    api.on('select', () => {
      setCurrent(api.selectedScrollSnap() + 1);
    });
  }, [api]);

  const navigate = useNavigate({ from: '/' });
  const { mutate } = useWelcomeUser();

  const isLastStep = current === steps.length - 1;
  const isFirstStep = current - 1 === 0;

  const previous = () => {
    if (api) {
      api.scrollPrev();
    }
  };

  const next = () => {
    if (api) {
      api.scrollNext();
    }
  };

  const handleFinish = useCallback(() => {
    mutate(userStep, {
      async onSuccess() {
        await navigate({ to: '/home', replace: true });
      },
      onError(error) {
        toast('An error occurred while creating your user.', {
          description: `${error.response?.data.errors?.[0].code}: ${error.response?.data.errors?.[0].description}`,
        });
      },
    });
  }, [mutate, navigate, userStep]);

  return (
    <>
      <div className='flex h-full w-full items-center justify-center'>
        <div className='flex flex-col gap-4'>
          <Progress className='w-full' max={steps.length} value={(current / steps.length) * 100} />
          <Carousel className='w-full max-w-2xl' setApi={setApi}>
            <CarouselContent>
              {steps.map((_, index) => (
                <CarouselItem key={index}>
                  <div className='flex w-full flex-col p-1'>
                    <Card>
                      <CardContent className='flex aspect-square items-center justify-center p-6'>
                        {index === 0 && <StepZero />}
                        {index === 1 && <StepOne setUserStep={setUserStep} value={userStep} />}
                        {index === 2 && <Finish />}
                      </CardContent>
                    </Card>
                  </div>
                </CarouselItem>
              ))}
            </CarouselContent>
          </Carousel>
          <div className='flex items-center justify-between gap-4'>
            <Button className='w-1/4' disabled={isFirstStep} onClick={previous}>
              Prev
            </Button>
            {isLastStep ? (
              <Button className='w-1/4' onClick={handleFinish}>
                Finish
              </Button>
            ) : (
              <Button className='w-1/4' onClick={next}>
                Next
              </Button>
            )}
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
      <div className='text-muted-foreground w-2/3'>
        <p>The app helps you to monitor your energy usage and costs faster and more clearly.</p>
        <p>So you don&apos;t have to struggle with large spreadsheets or buy expensive apps.</p>
      </div>
      <p className='text-muted-foreground w-2/3'>
        If you have any questions, ideas, feedback or just want to say hello, just drop by at our{' '}
        <a
          className='decoration-primary cursor-pointer underline'
          href='https://github.com/maxstue/kijk/discussions'
          rel='noopener noreferrer'
          target='_blank'
        >
          github
        </a>
        . 🙂
      </p>
    </div>
  );
}

function StepOne({
  value,
  setUserStep,
}: {
  value: UserStepFormValues;
  setUserStep: (data: UserStepFormValues) => void;
}) {
  return (
    <div className='flex h-full flex-col items-center justify-start gap-12 pt-6'>
      <div className='text-2xl'>User setup</div>
      <div className='flex w-2/3 flex-col items-center justify-end gap-4'>
        <div className='text-muted-foreground'>Setup your username and categories</div>
        <div className='text-muted-foreground'>You can change this setting at a later date in you profile.</div>
      </div>
      <UserStepForm className='w-2/3' value={value} onNext={setUserStep} />
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
