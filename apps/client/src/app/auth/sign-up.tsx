import { Dispatch, useCallback, useState } from 'react';

import { UserAuthForm } from '@/app/auth/auth-form';
import { Icons } from '@/shared/components/icons';
import { Button } from '@/shared/components/ui/button';
import { useToast } from '@/shared/hooks/use-toast';
import { useAuthStoreActions } from '@/shared/stores/auth-store';

export function SignUp({ goto }: { goto: Dispatch<React.SetStateAction<'Login' | 'Sign Up'>> }) {
  const [success, setSuccess] = useState<boolean>(false);
  const { register } = useAuthStoreActions();
  const { toast } = useToast();

  const handleRegister = useCallback(
    async (email: string, password: string) => {
      const result = await register(email.toLowerCase(), password);

      if (result.error != null) {
        toast({
          title: 'Something went wrong.',
          description: result.error.message ?? 'Your sign in request failed. Please try again.',
          variant: 'destructive',
        });
        return;
      }
      setSuccess(true);
    },
    [register, toast],
  );

  const handleGoToLogin = useCallback(() => {
    goto('Login');
  }, [goto]);

  return (
    <div className='container flex h-screen w-screen flex-col items-center justify-center'>
      <div className='mx-auto flex w-full flex-col justify-center space-y-6 sm:w-[400px]'>
        <div className='flex flex-col space-y-2 text-center'>
          <Icons.logo className='mx-auto h-12 w-12 text-primary' />
          <h1 className='text-2xl font-semibold tracking-tight'>Create an account</h1>
          <p className='text-sm text-muted-foreground'>Enter your credentials below to create your account</p>
        </div>
        {success ? (
          <div className='mb-8 flex flex-col items-center'>
            <p className='text-lg text-primary'>Please confirm the email we&apos;ve sent to your email.</p>
            <span>✉️</span>
          </div>
        ) : (
          <UserAuthForm onSubmit={handleRegister} btnLabel='Sign Up' />
        )}
        <p className='px-8 text-center text-sm text-muted-foreground'>
          <Button variant='link' onClick={handleGoToLogin}>
            Have an account? Sign In
          </Button>
        </p>
      </div>
    </div>
  );
}
