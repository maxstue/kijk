import { useSignIn } from '@clerk/react/legacy';
import { Button } from '@kijk/ui/components/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@kijk/ui/components/card';
import { getRouteApi } from '@tanstack/react-router';
import { useCallback } from 'react';
import type { Dispatch } from 'react';
import { toast } from 'sonner';

import { UserAuthForm } from '@/app/auth/auth-form';
import { config } from '@/shared/config';

const route = getRouteApi('/auth');

export function Login({ goto }: { goto: Dispatch<React.SetStateAction<'Login' | 'Sign Up'>> }) {
  const { isLoaded, signIn, setActive } = useSignIn();
  const navigate = route.useNavigate();
  const search = route.useSearch();
  const from = search.from ?? '/';

  const handleLogin = useCallback(
    async (email: string, password: string) => {
      if (!isLoaded) {
        return;
      }
      try {
        const completeLogin = await signIn.create({
          identifier: email,
          password,
        });

        if (completeLogin.status !== 'complete') {
          toast.error('Your login request failed. Please try again.', {
            description: <div>{JSON.stringify(completeLogin, undefined, 2)}</div>,
          });
        }

        if (completeLogin.status === 'complete') {
          await setActive({ session: completeLogin.createdSessionId });
          navigate({ params: true, to: from });
        }
      } catch (error_) {
        const error = error_ as { errors: Array<{ message: string }> };
        toast.error('Your login request failed. Please try again.', {
          description: <div>{error.errors[0]?.message}</div>,
        });
      }
    },
    [from, isLoaded, navigate, setActive, signIn],
  );

  const handleGoToSignUp = useCallback(() => {
    goto('Sign Up');
  }, [goto]);

  return (
    <div className='flex flex-col gap-6'>
      <Card>
        <CardHeader className='text-center'>
          <CardTitle className='text-xl'>Welcome back</CardTitle>
          <CardDescription>Login with your Apple or Google account</CardDescription>
        </CardHeader>
        <CardContent>
          <>
            <div className='grid gap-6'>
              <UserAuthForm btnLabel='Login' onSubmit={handleLogin} />
              <div className='text-center text-sm'>
                <Button variant='link' onClick={handleGoToSignUp}>
                  Don&apos;t have an account? Sign Up
                </Button>
              </div>
            </div>
          </>
        </CardContent>
      </Card>
      <div className='text-muted-foreground [&_a]:hover:text-primary text-center text-xs text-balance [&_a]:underline [&_a]:underline-offset-4'>
        By clicking continue, you agree to our <a href={`${config.WebUrl}/terms`}>Terms of Service</a> and{' '}
        <a href={`${config.WebUrl}/privacy`}>Privacy Policy</a>.
      </div>
    </div>
  );
}
