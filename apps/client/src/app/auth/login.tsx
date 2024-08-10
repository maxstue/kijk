import { Dispatch, useCallback } from 'react';
import { useSignIn } from '@clerk/clerk-react';
import { getRouteApi } from '@tanstack/react-router';

import { UserAuthForm } from '@/app/auth/auth-form';
import { Icons } from '@/shared/components/icons';
import { Button } from '@/shared/components/ui/button';
import { useToast } from '@/shared/hooks/use-toast';

const route = getRouteApi('/auth');

export function Login({ goto }: { goto: Dispatch<React.SetStateAction<'Login' | 'Sign Up'>> }) {
  const { toast } = useToast();
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
          toast({
            title: 'Your login request failed. Please try again.',
            description: <div>{JSON.stringify(completeLogin, undefined, 2)}</div>,
            variant: 'destructive',
          });
        }

        if (completeLogin.status === 'complete') {
          await setActive({ session: completeLogin.createdSessionId });
          navigate({ to: from, params: true });
        }
      } catch (error_) {
        const error = error_ as { errors: Array<{ message: string }> };
        toast({
          title: 'Your login request failed. Please try again.',
          description: <div>{error.errors[0]?.message}</div>,
          variant: 'destructive',
        });
      }
    },
    [from, isLoaded, navigate, setActive, signIn, toast],
  );

  const handleGoToSignUp = useCallback(() => {
    goto('Sign Up');
  }, [goto]);

  return (
    <div className='container flex h-screen w-screen flex-col items-center justify-center'>
      <div className='mx-auto flex w-full flex-col justify-center space-y-6 sm:w-[400px]'>
        <div className='flex flex-col space-y-2 text-center'>
          <Icons.logo className='mx-auto h-12 w-12 text-primary' />
          <h1 className='text-2xl font-semibold tracking-tight'>Welcome back</h1>
          <p className='text-sm text-muted-foreground'>Enter your credentials to log in to your account</p>
        </div>
        <UserAuthForm btnLabel='Login' onSubmit={handleLogin} />
        <p className='px-8 text-center text-sm text-muted-foreground'>
          <Button variant='link' onClick={handleGoToSignUp}>
            Don&apos;t have an account? Sign Up
          </Button>
        </p>
      </div>
    </div>
  );
}
