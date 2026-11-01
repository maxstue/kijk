import { useSignIn } from '@clerk/tanstack-react-start/legacy';
import { Button } from '@kijk/ui/components/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@kijk/ui/components/card';
import { Link, useRouter } from '@tanstack/react-router';
import { useCallback, useState } from 'react';
import type { Dispatch } from 'react';

import { UserAuthForm } from '@/app/auth/auth-form';
import { authErrorMessage } from '@/app/auth/helpers';

interface Props {
  goto: Dispatch<React.SetStateAction<'Login' | 'Sign Up'>>;
  redirectTo: string;
}

/** Sign-in view; rechecks the auth route after Clerk activates the session. */
export function Login({ goto, redirectTo }: Props) {
  const { isLoaded, signIn, setActive } = useSignIn();
  const router = useRouter();
  const [errorMessage, setErrorMessage] = useState<string>();

  const handleLogin = useCallback(
    async (email: string, password: string) => {
      if (!isLoaded) {
        setErrorMessage('Sign-in is still loading. Please wait a moment and try again.');
        return;
      }
      setErrorMessage(undefined);
      try {
        const completeLogin = await signIn.create({
          identifier: email,
          password,
        });

        if (completeLogin.status !== 'complete') {
          setErrorMessage(
            'Your sign-in requires additional verification and could not be completed here. Try another sign-in method or contact support.',
          );
        }

        if (completeLogin.status === 'complete') {
          await setActive({ session: completeLogin.createdSessionId });
          await router.invalidate();
        }
      } catch (error) {
        setErrorMessage(
          authErrorMessage(error, 'Sign-in could not be completed. Please check your connection and try again.'),
        );
      }
    },
    [isLoaded, router, setActive, signIn],
  );

  const handleGoToSignUp = useCallback(() => {
    goto('Sign Up');
  }, [goto]);

  return (
    <div className='flex flex-col gap-6'>
      <Card>
        <CardHeader className='text-center'>
          <CardTitle className='text-xl'>Welcome back</CardTitle>
          <CardDescription>Sign in with your email, Google, or GitHub account</CardDescription>
        </CardHeader>
        <CardContent>
          <div className='grid gap-6'>
            {errorMessage && (
              <p role='alert' className='text-destructive text-sm'>
                {errorMessage}
              </p>
            )}
            <UserAuthForm btnLabel='Login' redirectTo={redirectTo} onSubmit={handleLogin} />
            <div className='text-center text-sm'>
              <Button variant='link' onClick={handleGoToSignUp}>
                Don&apos;t have an account? Sign Up
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
      <div className='text-muted-foreground [&_a]:hover:text-primary text-center text-xs text-balance [&_a]:underline [&_a]:underline-offset-4'>
        By clicking continue, you agree to our{' '}
        <Link to='/terms' rel='noopener noreferrer' target='_blank'>
          Terms of Service
        </Link>{' '}
        and{' '}
        <Link to='/privacy' rel='noopener noreferrer' target='_blank'>
          Privacy Policy
        </Link>
        .
      </div>
    </div>
  );
}
