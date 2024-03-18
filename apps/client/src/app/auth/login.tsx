import { Dispatch, useCallback } from 'react';
import { getRouteApi, useNavigate } from '@tanstack/react-router';

import { UserAuthForm } from '@/app/auth/auth-form';
import { Icons } from '@/shared/components/icons';
import { Button } from '@/shared/components/ui/button';
import { useToast } from '@/shared/hooks/use-toast';
import { useAuthStoreActions } from '@/shared/stores/auth-store';

const route = getRouteApi('/auth');

export function Login({ goto }: { goto: Dispatch<React.SetStateAction<'Login' | 'Sign Up'>> }) {
  const { login } = useAuthStoreActions();
  const { toast } = useToast();
  const navigate = useNavigate();
  const search = route.useSearch();
  const from = search.from ?? '/';

  const handleLogin = useCallback(
    async (email: string, password: string) => {
      const result = await login(email.toLowerCase(), password);

      if (result.error != null) {
        toast({
          title: 'Something went wrong.',
          description: result.error.message ?? 'Your sign in request failed. Please try again.',
          variant: 'destructive',
        });
      }
      void navigate({ to: from, params: true });
    },
    [from, login, navigate, toast],
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
        <UserAuthForm onSubmit={handleLogin} btnLabel='Login' />
        <p className='px-8 text-center text-sm text-muted-foreground'>
          <Button variant='link' onClick={handleGoToSignUp}>
            Don&apos;t have an account? Sign Up
          </Button>
        </p>
      </div>
    </div>
  );
}
